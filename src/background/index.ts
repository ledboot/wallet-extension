import { EVENTS, CHAIN_INFO, ChainType } from '@/shared/constants';
import eventBus from '@/shared/eventBus';
import PortMessage from '@/shared/utils/message/portMessage';

import { walletController } from './controller';
import { keyringService, preferenceService, openapiService } from './service';
import { storage } from './webapi';
import {
  browserRuntimeOnConnect,
  browserRuntimeOnInstalled,
} from './webapi/browser';
import { openExtensionInTab } from './webapi/tab';
import { signTransaction } from './utils/transactionTools';

let appStoreLoaded = false;

async function start() {
  const keyringState = await storage.get('keyringState');
  console.log('keyringState', keyringState);
  keyringService.loadStore(keyringState);
  keyringService.store.subscribe((value) => storage.set('keyringState', value));
  await preferenceService.init();
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

browserRuntimeOnConnect((port: any) => {
  if (
    port.name === 'popup' ||
    port.name === 'notification' ||
    port.name === 'tab' ||
    port.name === 'sidepanel'
  ) {
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
              const result = await walletController[
                data.method as keyof typeof walletController
              ].apply(null, data.args);
              console.log('result-----', result);
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
});

// Handle simple message requests from content scripts
chrome.runtime.onMessage.addListener( (message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  // Handle wallet requests
  if (message && typeof message === 'object') {
    const { method, params } = message;
    console.log('--------params', params);
    
    if (method === 'CONNECT_WALLET') {
      chrome.action.openPopup().then(() => {
        sendResponse({ 
          success: true, 
          result: { 
            result: true 
          } 
        });
      }).catch((error) => {
        console.error('Failed to open popup:', error);
        sendResponse({ 
          success: false, 
          error: 'Failed to open wallet popup' 
        });
      });
      return true;
    }
    
    if (method === 'DISCONNECT_WALLET') {
      try {
        sendResponse({
          success: true,
          result: { disconnected: true }
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: 'Failed to disconnect wallet'
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
            result: currentAccount
          });
        } catch (error) {
          sendResponse({
            success: false,
            error: 'Failed to get current account'
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
            result: accounts
          });
        } catch (error) {
          sendResponse({
            success: false,
            error: 'Failed to get accounts'
          });
        }
      })();
      return true;
    }
    
    if (method === 'GET_BALANCE') {
      try {
        const utxos = keyringService.getUtxoSum(params.address, params.chainId);
        const coinName = keyringService.getCoinNames(utxos[0].tokenType);
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
            network: chainType.toLowerCase()
          }
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: 'Failed to get balance'
        });
      }
      return true;
    }
    
    if (method === 'GET_NETWORK') {
      try {
        const networkType = preferenceService.store.networkType;
        const chainType = preferenceService.store.chainType;
        const currentChainInfo = CHAIN_INFO[chainType];
        
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
            rpcUrl: currentChainInfo.endpoints[0]
          }
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: 'Failed to get network'
        });
      }
      return true;
    }
    
    if (method === 'SWITCH_NETWORK') {
      try {
        const targetChainId = params.chainId;
        
        // 优先从存储中查找网络，然后从常量中查找
        let targetChainType = Object.entries(preferenceService.getAllchainInfo()).find(([_, chainInfo]) => 
          chainInfo.chainId === targetChainId
        )?.[0] as string;
        
        if (!targetChainType) {
          targetChainType = Object.entries(CHAIN_INFO).find(([_, chainInfo]) => 
            chainInfo.chainId === targetChainId
          )?.[0] as string;
        }
        
        if (!targetChainType) {
          sendResponse({
            success: false,
            error: `Unsupported chainId: ${targetChainId}`
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
        
        preferenceService.store.networkType = targetChainInfo.networkType;
        preferenceService.store.chainType = targetChainType as ChainType;
        
        keyringService.changeNetwork();
        // Broadcast network change to UI
        eventBus.emit(EVENTS.broadcastToUI, {
          method: 'networkChanged',
          params: targetChainType
        });
        
        sendResponse({
          success: true,
          result: {
            chainId: targetChainId,
            chainType: targetChainType,
            networkType: targetChainInfo.networkType,
            rpcUrl: targetChainInfo.endpoints[0],
            switched: true
          }
        });
      } catch (error) {
        sendResponse({
          success: false,
          error: 'Failed to switch network'
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
              error: 'Missing transaction data'
            });
            return;
          }
          const signedTx = await signTransaction(params.tx, 1);
          sendResponse({
            success: true,
            result: {
              signed: true,
              signedTransaction: signedTx,
              requiresPopup: false
            }
          });
        } catch (error) {
          console.error('Transaction signing error:', error);
          sendResponse({
            success: false,
            error: 'Failed to sign transaction'
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
              error: 'Missing transaction data'
            });
            return;
          }
          const txHash = await openapiService.sendRawTransaction(params.tx, 0);
          sendResponse({
            success: true,
            result: {
              txHash: txHash,
              status: 'send'
            }
          });
        } catch (error) {
          console.error('Transaction sending error:', error);
          sendResponse({
            success: false,
            error: 'Failed to send transaction'
          });
        }
      })();
      return true;
    }

    if (method === 'GET_UTXOS') {
      const assets = keyringService.getUtxosByAddress(params.address)
      console.log('----------assets', assets);
      sendResponse({ 
        success: true, 
        result: assets
      });
      return true;
    }
    
    // if (method === 'SIGN_MESSAGE') {
    //   // Open popup for message signing
    //   chrome.action.openPopup().then(() => {
    //     sendResponse({
    //       success: true,
    //       result: {
    //         signed: false,
    //         requiresPopup: true
    //       }
    //     });
    //   }).catch((error) => {
    //     sendResponse({
    //       success: false,
    //       error: 'Failed to open signing popup'
    //     });
    //   });
    //   return true;
    // }
    
    // if (method === 'SIGN_TYPED_DATA') {
    //   // Open popup for typed data signing
    //   chrome.action.openPopup().then(() => {
    //     sendResponse({
    //       success: true,
    //       result: {
    //         signed: false,
    //         requiresPopup: true
    //       }
    //     });
    //   }).catch((error) => {
    //     sendResponse({
    //       success: false,
    //       error: 'Failed to open signing popup'
    //     });
    //   });
    //   return true;
    // }

    
    
    // // Handle EIP-1193 standard requests
    // if (method === 'eth_requestAccounts') {
    //   // EIP-1193: Request accounts
    //   try {
    //     const accounts = keyringService.getAccounts();
    //     sendResponse({
    //       success: true,
    //       result: accounts
    //     });
    //   } catch (error) {
    //     sendResponse({
    //       success: false,
    //       error: 'Failed to request accounts'
    //     });
    //   }
    //   return true;
    // }
    
    // if (method === 'eth_accounts') {
    //   // EIP-1193: Get accounts
    //   try {
    //     const accounts = keyringService.getAccounts();
    //     sendResponse({
    //       success: true,
    //       result: accounts
    //     });
    //   } catch (error) {
    //     sendResponse({
    //       success: false,
    //       error: 'Failed to get accounts'
    //     });
    //   }
    //   return true;
    // }
    
    // if (method === 'eth_chainId') {
    //   // EIP-1193: Get chain ID
    //   try {
    //     const networkType = preferenceService.store.networkType;
    //     const chainType = preferenceService.store.chainType;
    //     sendResponse({
    //       success: true,
    //       result: chainType
    //     });
    //   } catch (error) {
    //     sendResponse({
    //       success: false,
    //       error: 'Failed to get chain ID'
    //     });
    //   }
    //   return true;
    // }
    
    // if (method === 'wallet_switchEthereumChain') {
    //   // EIP-1193: Switch chain
    //   try {
    //     preferenceService.store.networkType = params[0].chainId;
    //     preferenceService.store.chainType = params[0].chainId;
    //     sendResponse({
    //       success: true,
    //       result: { chainId: params[0].chainId }
    //     });
    //   } catch (error) {
    //     sendResponse({
    //       success: false,
    //       error: 'Failed to switch chain'
    //     });
    //   }
    //   return true;
    // }
    
    // if (method === 'eth_sendTransaction') {
    //   // EIP-1193: Send transaction
    //   try {
    //     // This would need actual transaction implementation
    //     const txHash = '0x' + Math.random().toString(16).substr(2, 64);
    //     sendResponse({
    //       success: true,
    //       result: { txHash }
    //     });
    //   } catch (error) {
    //     sendResponse({
    //       success: false,
    //       error: 'Failed to send transaction'
    //     });
    //   }
    //   return true;
    // }
    
    
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
