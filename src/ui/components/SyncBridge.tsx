import { PropsWithChildren, useEffect } from 'react';
import { keyringsStore } from '@/ui/state/keyrings';
import { accountsStore } from '@/ui/state/accounts';
import { settingsStore } from '@/ui/state/settings';
import { Message } from '@/shared/utils';
import eventBus from '@/shared/eventBus';
import { EVENTS, ChainType, NetworkType, CHAIN_INFO } from '@/shared/constants';
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
          break;
        }
        case 'initVault':{
          navigate('WelcomeScreen');
          break;
        }
        case 'updateKeyrings': {
          updateKeyrings()
          break;
        }
        case 'networkChanged': {
          // 更新前端设置状态
          if (params && typeof params === 'string') {
            const chainType = params as ChainType;
            
            // 优先从 CHAIN_INFO 获取，如果没有则从存储获取
            let networkType: NetworkType;
            if (CHAIN_INFO[chainType]) {
              networkType = CHAIN_INFO[chainType].networkType;
            } else {
              // 从存储中获取网络配置
              const storedChainInfo = await wallet.getStoredChainInfo();
              const chainInfo = storedChainInfo[chainType];
              if (chainInfo) {
                networkType = chainInfo.networkType;
              } else {
                console.error('Network info not found for:', chainType);
                return;
              }
            }
            
            settingsStore.getState().updateSettings({
              networkType,
              chainType
            });
            updateKeyrings()
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

  const updateKeyrings = async () => {
    const keyrings = await wallet.getKeyrings();
    if (keyrings && keyrings.length > 0) {
      keyringsStore.getState().setKeyrings(keyrings);
      
      const currentKeyring = await wallet.getCurrentKeyring();
      if (currentKeyring) {
        keyringsStore.getState().setCurrent(currentKeyring);
      }

      const currentAccount = await wallet.getCurrentAccount();
      if (currentAccount) {
        accountsStore.getState().setCurrent(currentAccount);
      }
    }
  }
  
  return props.children as any;
}


