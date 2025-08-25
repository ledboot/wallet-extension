import { createRoot } from 'react-dom/client';

import '@/assets/styles/index.css';
import MainRoute from './pages/mainRoute';
import { WalletProvider } from './utils/walletContext';
import { Message } from '@/shared/utils';
import { AppDimensions } from './components/appDimensions';
import { Toaster } from 'sonner';
import SyncBridge from '@/ui/components/SyncBridge';


const { PortMessage } = Message;

const portMessageChannel = new PortMessage();

portMessageChannel.connect('popup');

const wallet: Record<string, any> = new Proxy(
  {},
  {
    get(obj,key){
      switch(key){
        default:
          return function(...args: any){
            return portMessageChannel.request({
              type: 'controller',
              method: key,
              args
            });
          }
      }
    }
  }
);



const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <WalletProvider wallet={wallet as any}>
    <AppDimensions>
      <Toaster position='top-center' />
      <SyncBridge>
        <MainRoute/>
      </SyncBridge>
    </AppDimensions>
  </WalletProvider>
);
