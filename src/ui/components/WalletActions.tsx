import { History, Download, Send } from 'lucide-react';

export function WalletActions() {
  return (
    <div className='grid w-full grid-cols-4 gap-3'>
      <button className='bg-wallet-card border-border hover:border-primary/50 btn btn-outline flex h-16 flex-col space-y-1 transition-all'>
        <Send className='h-5 w-5' />
        <span className='text-xs'>Send</span>
      </button>

      <button className='bg-wallet-card border-border hover:border-primary/50 btn btn-outline flex h-16 flex-col space-y-1 transition-all'>
        <Download className='h-5 w-5' />
        <span className='text-xs'>Receive</span>
      </button>

      <button className='bg-wallet-card border-border hover:border-primary/50 btn btn-outline flex h-16 flex-col space-y-1 transition-all'>
        <History className='h-5 w-5' />
        <span className='text-xs'>History</span>
      </button>
    </div>
  );
}
