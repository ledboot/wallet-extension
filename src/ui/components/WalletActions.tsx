import { Download, History, Send } from 'lucide-react';

import { capturePostHogEvent } from '@/shared/telemetry/posthog';
import { useLanguage } from '@/ui/contexts/LanguageContext';

import { useNavigate } from '../pages/MainRoute';

export function WalletActions() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className='grid w-full grid-cols-3 gap-3'>
      <button
        onClick={() => {
          capturePostHogEvent('wallet_action_send_clicked');
          navigate('TokenSelectionScreen');
        }}
        className='flex flex-col items-center justify-center space-y-2 rounded-2xl bg-gray-50 py-4 transition-colors hover:bg-gray-100 active:bg-gray-200'
      >
        <Send className='h-6 w-6 text-gray-900' />
        <span className='text-xs font-medium text-gray-900'>
          {t('assets.send')}
        </span>
      </button>

      <button
        onClick={() => {
          capturePostHogEvent('wallet_action_receive_clicked');
          navigate('ReceiveScreen');
        }}
        className='flex flex-col items-center justify-center space-y-2 rounded-2xl bg-gray-50 py-4 transition-colors hover:bg-gray-100 active:bg-gray-200'
      >
        <Download className='h-6 w-6 text-gray-900' />
        <span className='text-xs font-medium text-gray-900'>
          {t('assets.receive')}
        </span>
      </button>

      <button
        onClick={() => {
          capturePostHogEvent('wallet_action_history_clicked');
          navigate('HistoryScreen');
        }}
        className='flex flex-col items-center justify-center space-y-2 rounded-2xl bg-gray-50 py-4 transition-colors hover:bg-gray-100 active:bg-gray-200'
      >
        <History className='h-6 w-6 text-gray-900' />
        <span className='text-xs font-medium text-gray-900'>
          {t('assets.history')}
        </span>
      </button>
    </div>
  );
}
