import { PropsWithChildren, useEffect } from 'react';
import { keyringsStore } from '@/ui/state/keyrings';
import { accountsStore } from '@/ui/state/accounts';
import { Message } from '@/shared/utils';
import eventBus from '@/shared/eventBus';
import { EVENTS } from '@/shared/constants';
import { useNavigate } from '@/ui/pages/mainRoute';
import { globalStore } from '@/ui/state/global';
import { useWallet } from '@/ui/utils';
const { PortMessage } = Message;

export default function SyncBridge(props: PropsWithChildren) {
  const navigate = useNavigate();
  const wallet = useWallet();
  
  useEffect(() => {
    
    // 监听 PortMessage 的广播事件并转发到 eventBus
    const portMessageChannel = new PortMessage();
    portMessageChannel.connect('popup');
    
    const broadcastHandler = (data: any) => {
      if (data?.type === 'broadcast') {
        console.log('SyncBridge received broadcast:', data);
        eventBus.emit(EVENTS.broadcastToUI, {
          method: data.method,
          params: data.params
        });
      }
    };
    
    portMessageChannel.listen(broadcastHandler);

    // 定时发送心跳（仅在 popup 打开时保持）
    const heartbeatInterval = setInterval(() => {
      try {
        portMessageChannel.request({
          type: 'controller',
          method: 'heartbeat',
          args: []
        });
      } catch (e) {
        // ignore
      }
    }, 15 * 1000);

    // 统一接收并按 method 分发处理
    const onBroadcastToUI = async (payload: any) => {
      if (!payload || !payload.method) return;

      const { method, params } = payload;

      switch (method) {
        case 'lock': {
          console.log('received broadcast lock');
          globalStore.getState().update({ isUnlocked: false });
          navigate('UnlockScreen');
          break;
        }
        case 'unlock': {
          globalStore.getState().update({ isUnlocked: true });
          const keyrings = await wallet.getKeyrings();
          if (keyrings && keyrings.length > 0) {
            keyringsStore.getState().setKeyrings(keyrings);
          }
          const currentKeyring = await wallet.getCurrentKeyring();
          if (currentKeyring) {
            keyringsStore.getState().setCurrent(currentKeyring);
          }
          const currentAccount = await wallet.getCurrentAccount();
          if (currentAccount) {
            accountsStore.getState().setCurrent(currentAccount);
          }
          break;
        }
        case 'initVault':{
          navigate('WelcomeScreen');
          break;
        }
        case 'updateKeyrings': {
          const keyrings = await wallet.getKeyrings();
          console.log('SyncBridge updateKeyrings keyrings', keyrings);
          if (keyrings && keyrings.length > 0) {
            keyringsStore.getState().setKeyrings(keyrings);
            
            const currentKeyring = await wallet.getCurrentKeyring();
            console.log('SyncBridge updateKeyrings currentKeyring', currentKeyring);
            if (currentKeyring) {
              keyringsStore.getState().setCurrent(currentKeyring);
            }

            const currentAccount = await wallet.getCurrentAccount();
            console.log('SyncBridge updateKeyrings currentAccount', currentAccount);
            if (currentAccount) {
              accountsStore.getState().setCurrent(currentAccount);
            }
          }
          break;
        }
        // 可以在此添加更多广播事件处理
        // case 'keyringsChanged': { ... break; }
        // case 'accountsUpdated': { ... break; }
        default: {
          // 透传到以 method 为粒度的 UI 事件，供其他模块按需订阅
          eventBus.emit(`ui:${method}`, params);
          break;
        }
      }
    };
    eventBus.addEventListener(EVENTS.broadcastToUI, onBroadcastToUI);
    
    return () => {
      portMessageChannel.dispose();
      eventBus.removeEventListener(EVENTS.broadcastToUI, onBroadcastToUI);
      clearInterval(heartbeatInterval);
    };
  }, [navigate, wallet]);
  
  return props.children as any;
}


