import { PropsWithChildren, useEffect } from 'react';
import { keyringsStore } from '@/ui/state/keyrings';
import { useWallet } from '@/ui/utils/walletContext';
import { Message } from '@/shared/utils';
import eventBus from '@/shared/eventBus';
import { EVENTS } from '@/shared/constants';

const { PortMessage } = Message;

export default function SyncBridge(props: PropsWithChildren) {
  const walletController = useWallet();
  
  useEffect(() => {
    // 启动 keyrings 同步
    keyringsStore.getState().startSync(() => walletController.getKeyrings());
    
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
    
    return () => {
      keyringsStore.getState().stopSync();
      portMessageChannel.dispose();
    };
  }, [walletController]);
  
  return props.children as any;
}


