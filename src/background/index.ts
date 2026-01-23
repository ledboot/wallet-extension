import { EVENTS, CHAIN_INFO } from '@/shared/constants';
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
      // Open popup for wallet connection
      chrome.action.openPopup().then(() => {
        // Send response after popup is opened
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
      return true; // Keep the message channel open for async response
    }
    
    if (method === 'DISCONNECT_WALLET') {
      // Handle wallet disconnection
      try {
        // Clear current session
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
          //返回所有账户
          const accounts = await keyringService.getAccounts();
          //返回当前帐户
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
          //返回所有账户
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
      // Get balance for specific address
      try {
        // const utxos = keyringService.getUtxosByAddress(params.address);
        const utxos = keyringService.getUtxoSum(params.address, params.chainId);
        const coinName = keyringService.getCoinNames(utxos[0].tokenType);
        const balance = utxos[0].value;
        const decimals = coinName[0].decimalpoint;
        const formatted = utxos[0].value / Math.pow(10, decimals);
        const symbol = coinName[0].name;
        
        // Get current network info
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
            network: chainType.toLowerCase() // 'mainnet' or 'testnet'
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
      // Get current network
      try {
        const networkType = preferenceService.store.networkType;
        const chainType = preferenceService.store.chainType;
        
        // Get real RPC URL from CHAIN_INFO
        const currentChainInfo = CHAIN_INFO[chainType];
        
        sendResponse({
          success: true,
          result: {
            id: chainType,
            name: networkType,
            rpcUrl: currentChainInfo.endpoints[0] // Use real RPC URL from config
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
      // Switch to different network
      try {
        const targetChainId = params.chainId;
        
        // Find ChainType by chainId value
        const targetChainType = Object.entries(CHAIN_INFO).find(([_, chainInfo]) => 
          chainInfo.chainId === targetChainId
        )?.[0] as keyof typeof CHAIN_INFO;
        
        // Validate chainId exists in CHAIN_INFO
        if (!targetChainType) {
          sendResponse({
            success: false,
            error: `Unsupported chainId: ${targetChainId}`
          });
          return true;
        }
        
        // Get network info for target chain
        const targetChainInfo = CHAIN_INFO[targetChainType];
        
        // Update preference service
        preferenceService.store.networkType = targetChainInfo.networkType;
        preferenceService.store.chainType = targetChainType;
        
        // Notify keyring service about network change
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
          // Validate required parameters
          if (!params || !params.tx) {
            sendResponse({
              success: false,
              error: 'Missing transaction data'
            });
            return;
          }
          // Sign the transaction
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
      // Send transaction after signing
      (async () => {
        try {
          // Validate required parameters
          if (!params || !params.tx) {
            sendResponse({
              success: false,
              error: 'Missing transaction data'
            });
            return;
          }
          
          // Send the raw transaction
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
      // Get UTXOs by address
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
