import { CHAIN_INFO, ChainType, EVENTS } from '@/shared/constants';
import eventBus from '@/shared/eventBus';
import PortMessage from '@/shared/utils/message/portMessage';

import { walletController } from './controller';
import { assetService, keyringService, openapiService, preferenceService, approvalService, sessionService } from './service';
import { signTransaction } from './utils/transactionTools';
import { storage } from './webapi';
import { browserRuntimeOnConnect, browserRuntimeOnInstalled } from './webapi/browser';
import { openExtensionInTab } from './webapi/tab';

const expandIcon = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:') || path.startsWith('chrome-extension:')) {
    return path;
  }
  const cleaned = path.startsWith('./') ? path.slice(2) : path;
  return chrome.runtime.getURL(cleaned);
};

let appStoreLoaded = false;

async function start() {
  const keyringState = await storage.get('keyringState');
  console.log('keyringState', keyringState);
  keyringService.loadStore(keyringState);
  keyringService.store.subscribe((value) => storage.set('keyringState', value));
  await preferenceService.init();
  await assetService.init();
  appStoreLoaded = true;
  console.log('appStoreLoaded', appStoreLoaded);
}

start();

/**
 * Handle extension installation event
 */
const addAppInstalledEvent = () => {
  if (appStoreLoaded) {
    openExtensionInTab('index.html', {});
    return;
  }
  setTimeout(() => {
    addAppInstalledEvent();
  }, 1000);
};

browserRuntimeOnInstalled((details: any) => {
  if (details.reason === 'install') {
    addAppInstalledEvent();
  }
});

// Track active content-script ports to broadcast wallet events
const contentScriptPorts = new Set<PortMessage>();

browserRuntimeOnConnect((port: any) => {
  if (port.name === 'popup' || port.name === 'notification' || port.name === 'tab' || port.name === 'sidepanel') {
    console.log('port', port);
    const pm = new PortMessage(port as any);
    pm.listen(async (data: any) => {
      if (data?.type) {
        switch (data.type) {
          case 'broadcast':
            eventBus.emit(data.method, data.params);
            return;
          case 'controller':
            console.log('received controller', data);
            if (data.method) {
              const result = await walletController[data.method as keyof typeof walletController].apply(
                null,
                data.args
              );
              return result;
            }
            return;
        }
      }
    });

    const boardcastCallback = (data: any) => {
      pm.request({
        type: 'broadcast',
        method: data.method,
        params: data.params,
      });
    };

    if (port.name === 'popup') {
      preferenceService.setPopupOpen(true);
      port.onDisconnect.addListener(() => {
        preferenceService.setPopupOpen(false);
      });
    }

    eventBus.addEventListener(EVENTS.broadcastToUI, boardcastCallback);
    port.onDisconnect.addListener(() => {
      eventBus.removeEventListener(EVENTS.broadcastToUI, boardcastCallback);
    });
    return;
  }

  // ─── Content-script bridge connection ────────────────────────────────────
  if (port.name === 'content-script') {
    const pm = new PortMessage(port as any);
    contentScriptPorts.add(pm);

    pm.listen(async (data: any) => {
      if (!data || !data.method) return;
      const { method, params } = data;

      switch (method) {
        case 'tabCheckin': {
          const { icon, name } = params as any;
          const origin = (port.sender as any)?.origin;
          if (origin) {
            const session = sessionService.getOrCreateSession(origin);
            if (session) {
              session.setProp({ origin, icon, name });
            }
          }
          return;
        }

        case 'keepAlive':
          return true;

        case 'getProviderState': {
          try {
            const accounts = await keyringService.getAccounts();
            const chainType = preferenceService.store.chainType;
            const isUnlocked = accounts.length > 0;
            return {
              accounts: accounts.map((a: any) => a.address),
              networkId: chainType,
              isUnlocked,
            };
          } catch {
            return { accounts: [], networkId: null, isUnlocked: false };
          }
        }

        case 'requestAccounts': {
          const origin = (port.sender as any)?.origin;
          const session = sessionService.getSession(origin);
          const accounts = await approvalService.requestApproval({
            origin: origin || 'Unknown',
            name: session?.data?.name || origin || 'Unknown DApp',
            icon: session?.data?.icon || '',
            type: 'connect',
          });
          return accounts;
        }

        case 'disconnect':
          return { disconnected: true };

        case 'getAccounts': {
          const accounts = await keyringService.getAccounts();
          return accounts.map((a: any) => a.address);
        }

        case 'getCurrentAccount': {
          const accounts = await keyringService.getAccounts();
          const idx = preferenceService.store.currentAccountIndex;
          return accounts[idx] || accounts[0] || null;
        }


        case 'getNetwork': {
          const chainInfo = preferenceService.store.currentChainInfo;
          return {
            id: chainInfo.id,
            name: chainInfo.label,
            rpcUrl: chainInfo.endpoints[0],
            chainId: chainInfo.chainId,
            icon: expandIcon(chainInfo.icon),
          };
        }

        case 'getNetworks': {
          const networks = preferenceService.getAllchainInfo();
          const result: any = {};
          for (const [key, ci] of Object.entries(networks)) {
            result[key] = {
              ...ci,
              name: (ci as any).label, // Support both label and name
              icon: expandIcon((ci as any).icon),
            };
          }
          return result;
        }
        case 'switchNetwork': {
          const targetChainId = (params as any)?.chainId;
          const origin = (port.sender as any)?.origin;
          const session = sessionService.getSession(origin);

          // Get target chain details
          let targetChainType = Object.entries(preferenceService.getAllchainInfo()).find(
            ([_, ci]) => ci.chainId === targetChainId
          )?.[0];
          if (!targetChainType) {
            targetChainType = Object.entries(CHAIN_INFO).find(([_, ci]) => ci.chainId === targetChainId)?.[0];
          }
          if (!targetChainType) throw new Error(`Unsupported chainId: ${targetChainId}`);
          const targetChainInfo = preferenceService.getchainInfo(targetChainType) || CHAIN_INFO[targetChainType];

          // Request user approval
          await approvalService.requestApproval({
            origin: origin || 'Unknown',
            name: session?.data?.name || origin || 'Unknown DApp',
            icon: session?.data?.icon || '',
            type: 'switchNetwork',
            params: {
              chainId: targetChainId,
              name: targetChainInfo.label,
            },
          });

          preferenceService.store.currentChainInfo = targetChainInfo;
          keyringService.changeNetwork();
          // Broadcast to all active content-script ports
          broadcastToContentScripts('networkChanged', {
            networkId: targetChainType,
          });
          return { switched: true, networkId: targetChainType };
        }

        case 'getBalance': {
          const { address, chainId } = (params as any) ?? {};
          const utxos = assetService.getUtxoSum(address, chainId);
          if (!utxos?.length) return { address, balance: 0 };
          const coinNames = assetService.getCoinNames(utxos[0].tokenType);
          const decimals = coinNames[0]?.decimalpoint ?? 0;
          return {
            address,
            balance: utxos[0].value,
            decimals,
            formatted: utxos[0].value / Math.pow(10, decimals),
            symbol: coinNames[0]?.name ?? '',
          };
        }

        case 'getUtxos': {
          const { address } = (params as any) ?? {};
          return assetService.getUtxosByAddress(address);
        }

        case 'signTransaction': {
          const { tx } = (params as any) ?? {};
          if (!tx) throw new Error('Missing transaction data');
          const origin = (port.sender as any)?.origin;
          const session = sessionService.getSession(origin);

          // Request user approval
          await approvalService.requestApproval({
            origin: origin || 'Unknown',
            name: session?.data?.name || origin || 'Unknown DApp',
            icon: session?.data?.icon || '',
            type: 'signTransaction',
            params: { tx },
          });

          const signedTx = await signTransaction(tx, 1);
          return { signedTransaction: signedTx };
        }

        case 'sendTransaction': {
          const { tx } = (params as any) ?? {};
          if (!tx) throw new Error('Missing transaction data');
          const origin = (port.sender as any)?.origin;
          const session = sessionService.getSession(origin);

          // Request user approval
          await approvalService.requestApproval({
            origin: origin || 'Unknown',
            name: session?.data?.name || origin || 'Unknown DApp',
            icon: session?.data?.icon || '',
            type: 'sendTransaction',
            params: { tx },
          });

          const txHash = await openapiService.sendRawTransaction(tx, 0);
          return { txHash };
        }

        default:
          throw new Error(`Unknown method: ${method}`);
      }
    });

    // Forward wallet events to the page provider via this port
    const broadcastCallback = (data: any) => {
      pm.request({
        event: data.method,
        data: data.params,
      });
    };
    eventBus.addEventListener(EVENTS.broadcastToUI, broadcastCallback);

    port.onDisconnect.addListener(() => {
      contentScriptPorts.delete(pm);
      eventBus.removeEventListener(EVENTS.broadcastToUI, broadcastCallback);
    });
    return;
  }
});

/** Push an event to all connected content-script ports. */
function broadcastToContentScripts(event: string, data: unknown) {
  for (const pm of contentScriptPorts) {
    pm.request({ event, data }).catch(() => null);
  }
}

// Handle simple message requests from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);

  // Handle wallet requests
  if (message && typeof message === 'object') {
    const { method, params } = message;
    console.log('--------params', params);

    if (method === 'CONNECT_WALLET') {
      chrome.action
        .openPopup()
        .then(() => {
          sendResponse({
            success: true,
            result: {
              result: true,
            },
          });
        })
        .catch((error) => {
          console.error('Failed to open popup:', error);
          sendResponse({
            success: false,
            error: 'Failed to open wallet popup',
          });
        });
      return true;
    }

    if (method === 'DISCONNECT_WALLET') {
      try {
        sendResponse({
          success: true,
          result: { disconnected: true },
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: 'Failed to disconnect wallet',
        });
      }
      return true;
    }

    if (method === 'GET_CURRENT_ACCOUNT') {
      (async () => {
        try {
          const accounts = await keyringService.getAccounts();
          const currentAccountIndex = preferenceService.store.currentAccountIndex;
          const currentAccount = accounts[currentAccountIndex] || accounts[0];

          sendResponse({
            success: true,
            result: currentAccount,
          });
        } catch (error) {
          sendResponse({
            success: false,
            error: 'Failed to get current account',
          });
        }
      })();
      return true;
    }

    if (method === 'GET_ACCOUNTS') {
      (async () => {
        try {
          const accounts = await keyringService.getAccounts();
          sendResponse({
            success: true,
            result: accounts,
          });
        } catch (error) {
          sendResponse({
            success: false,
            error: 'Failed to get accounts',
          });
        }
      })();
      return true;
    }

    if (method === 'GET_BALANCE') {
      try {
        const utxos = assetService.getUtxoSum(params.address, params.chainId);
        const coinName = assetService.getCoinNames(utxos[0].tokenType);
        const balance = utxos[0].value;
        const decimals = coinName[0].decimalpoint;
        const formatted = utxos[0].value / Math.pow(10, decimals);
        const symbol = coinName[0].name;

        const networkType = preferenceService.getNetworkType();
        const chainType = preferenceService.getChainType();

        sendResponse({
          success: true,
          result: {
            address: params.address,
            balance: balance,
            decimals: decimals,
            formatted: formatted,
            symbol: symbol,
            network: chainType.toLowerCase(),
          },
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: 'Failed to get balance',
        });
      }
      return true;
    }

    if (method === 'GET_NETWORK') {
      try {
        const networkType = preferenceService.store.networkType;
        const chainType = preferenceService.store.chainType;
        const currentChainInfo = preferenceService.store.currentChainInfo || CHAIN_INFO[chainType];

        if (!currentChainInfo) {
          throw new Error(`Chain info not found for: ${chainType}`);
        }

        if (!currentChainInfo.endpoints || currentChainInfo.endpoints.length === 0) {
          throw new Error(`No endpoints found for chain: ${chainType}`);
        }

        sendResponse({
          success: true,
          result: {
            id: chainType,
            name: networkType,
            rpcUrl: currentChainInfo.endpoints[0],
          },
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: 'Failed to get network',
        });
      }
      return true;
    }

    if (method === 'SWITCH_NETWORK') {
      try {
        const targetChainId = params.chainId;

        // 优先从存储中查找网络，然后从常量中查找
        let targetChainType = Object.entries(preferenceService.getAllchainInfo()).find(
          ([_, chainInfo]) => chainInfo.chainId === targetChainId
        )?.[0] as string;

        if (!targetChainType) {
          targetChainType = Object.entries(CHAIN_INFO).find(
            ([_, chainInfo]) => chainInfo.chainId === targetChainId
          )?.[0] as string;
        }

        if (!targetChainType) {
          sendResponse({
            success: false,
            error: `Unsupported chainId: ${targetChainId}`,
          });
          return true;
        }

        // 优先从存储中获取网络配置
        let targetChainInfo = preferenceService.getchainInfo(targetChainType);
        if (!targetChainInfo) {
          targetChainInfo = CHAIN_INFO[targetChainType];
        }

        if (!targetChainInfo) {
          throw new Error(`Chain info not found for: ${targetChainType}`);
        }

        if (!targetChainInfo.endpoints || targetChainInfo.endpoints.length === 0) {
          throw new Error(`No endpoints found for chain: ${targetChainType}`);
        }

        preferenceService.store.currentChainInfo = targetChainInfo;

        keyringService.changeNetwork();
        // Broadcast network change to UI
        eventBus.emit(EVENTS.broadcastToUI, {
          method: 'networkChanged',
          params: targetChainType,
        });

        sendResponse({
          success: true,
          result: {
            chainId: targetChainId,
            chainType: targetChainType,
            networkType: targetChainInfo.networkType,
            rpcUrl: targetChainInfo.endpoints[0],
            switched: true,
          },
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: 'Failed to switch network',
        });
      }
      return true;
    }

    if (method === 'SIGN_TRANSACTION') {
      (async () => {
        try {
          console.log('SIGN_TRANSACTION', params);
          if (!params || !params.tx) {
            sendResponse({
              success: false,
              error: 'Missing transaction data',
            });
            return;
          }

          // Request user approval
          await approvalService.requestApproval({
            origin: sender?.origin || 'Unknown',
            name: 'IDE', // Message listener usually comes from extension UI or tabs
            icon: '',
            type: 'signTransaction',
            params: { tx: params.tx },
          });

          const signedTx = await signTransaction(params.tx, 1);
          sendResponse({
            success: true,
            result: {
              signed: true,
              signedTransaction: signedTx,
              requiresPopup: false,
            },
          });
        } catch (error) {
          console.error('Transaction signing error:', error);
          sendResponse({
            success: false,
            error: 'Failed to sign transaction',
          });
        }
      })();
      return true;
    }

    if (method === 'SEND_TRANSACTION') {
      (async () => {
        try {
          if (!params || !params.tx) {
            sendResponse({
              success: false,
              error: 'Missing transaction data',
            });
            return;
          }

          // Request user approval
          await approvalService.requestApproval({
            origin: sender?.origin || 'Unknown',
            name: 'IDE',
            icon: '',
            type: 'sendTransaction',
            params: { tx: params.tx },
          });

          const txHash = await openapiService.sendRawTransaction(params.tx, 0);
          sendResponse({
            success: true,
            result: {
              txHash: txHash,
              status: 'send',
            },
          });
        } catch (error) {
          console.error('Transaction sending error:', error);
          sendResponse({
            success: false,
            error: 'Failed to send transaction',
          });
        }
      })();
      return true;
    }

    if (method === 'GET_UTXOS') {
      const assets = assetService.getUtxosByAddress(params.address);
      console.log('----------assets', assets);
      sendResponse({
        success: true,
        result: assets,
      });
      return true;
    }

  }

  // Default response
  sendResponse({ error: 'Unknown method' });
  return true;
});

// const INTERNAL_STAYALIVE_PORT = 'CT_Internal_port_alive';
// let alivePort: any | null = null;

// setInterval(() => {
//   if (alivePort == null) {
//     alivePort = chrome.runtime.connect({ name: INTERNAL_STAYALIVE_PORT });
//     alivePort.onDisconnect.addListener(() => {
//       if (chrome.runtime.lastError) {
//         // console.error('Keep-alive port disconnected:', chrome.runtime.lastError);
//       }
//       alivePort = null;
//     });
//   }

//   if (alivePort) {
//     alivePort.postMessage({ content: 'keep alive' });
//   }
// }, 5000);
