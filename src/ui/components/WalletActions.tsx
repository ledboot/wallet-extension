import { History, Download, Send } from 'lucide-react';
import { useNavigate } from '../pages/mainRoute';
import { useLanguage } from '@/ui/contexts/LanguageContext';

export function WalletActions() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className='grid w-full grid-cols-4 gap-3'>
      <button 
      onClick={() => navigate('TokenSelectionScreen')}
      className='bg-wallet-card border-border hover:border-primary/50 btn btn-outline flex h-16 flex-col space-y-1 transition-all'>
        <Send className='h-5 w-5' />
        <span className='text-xs'>{t('assets.send')}</span>
      </button>

      <button 
        onClick={() => navigate('ReceiveScreen')}
        className='bg-wallet-card border-border hover:border-primary/50 btn btn-outline flex h-16 flex-col space-y-1 transition-all'>
        <Download className='h-5 w-5' />
        <span className='text-xs'>{t('assets.receive')}</span>
      </button>

      <button 
        onClick={() => navigate('HistoryScreen')}
        className='bg-wallet-card border-border hover:border-primary/50 btn btn-outline flex h-16 flex-col space-y-1 transition-all'
      >
        <History className='h-5 w-5' />
        <span className='text-xs'>{t('assets.history')}</span>
      </button>
    </div>
  );
}
