import { EVENTS } from '@/shared/constants';
import eventBus from '@/shared/eventBus';
import PortMessage from '@/shared/utils/message/portMessage';

import { walletController } from './controller';
import { keyringService, preferenceService } from './service';
import { storage } from './webapi';
import {
  browserRuntimeOnConnect,
  browserRuntimeOnInstalled,
} from './webapi/browser';
import { openExtensionInTab } from './webapi/tab';

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
            break;
          case 'controller':
            console.log('received controller', data);
            if (data.method) {
              return await walletController[
                data.method as keyof typeof walletController
              ].apply(null, data.args);
            }
            break;
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
