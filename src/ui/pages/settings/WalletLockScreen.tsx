import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { getAutoLockTimes } from '@/shared/constants';
import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useWallet } from '@/ui/utils';

import { useNavigate } from '../MainRoute';

export default function WalletLockScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const wallet = useWallet();

  const [pendingTimeId, setPendingTimeId] = useState<number>(5);
  const [isLoading, setIsLoading] = useState(false);

  const autoLockTimes = getAutoLockTimes();

  useEffect(() => {
    const loadCurrentSetting = async () => {
      try {
        const currentTimeId = await wallet.getAutoLockTimeId();
        setPendingTimeId(currentTimeId);
      } catch (error) {
        console.error('Failed to load auto lock time:', error);
      }
    };
    loadCurrentSetting();
  }, [wallet]);

  const handleTimeChange = (timeId: number) => {
    setPendingTimeId(timeId);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await wallet.setAutoLockTimeId(pendingTimeId);
      navigate('MainScreen');
    } catch (error) {
      console.error('Failed to set auto lock time:', error);
      toast.error(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='flex h-[600px] w-full flex-col bg-white pt-14 dark:bg-gray-900'>
      <div className='absolute left-0 top-0 z-10 flex h-14 w-full items-center justify-between border-b border-gray-100 bg-white px-4 dark:border-gray-800 dark:bg-gray-900'>
        <button
          onClick={() => navigate('#back')}
          className='-ml-2 rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800'
        >
          <svg
            className='h-5 w-5 text-gray-800 dark:text-gray-200'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 19l-7-7 7-7' />
          </svg>
        </button>
        <h1 className='absolute left-1/2 -translate-x-1/2 transform text-lg font-semibold text-gray-900 dark:text-white'>
          {t('settings.wallet_lock_settings')}
        </h1>
        <div className='w-9'></div>
      </div>

      <div className='hide-scrollbar flex-1 overflow-y-auto px-4 pb-6'>
        <div className='mt-6'>
          <h2 className='mb-4 text-base font-semibold text-gray-900 dark:text-white'>{t('settings.auto_lock_time')}</h2>
          <div className='space-y-2'>
            {autoLockTimes.map((item) => (
              <button
                key={item.id}
                className={`flex w-full items-center justify-between rounded-lg border p-4 transition-colors ${
                  pendingTimeId === item.id
                    ? 'border-gray-900 bg-gray-50 dark:border-white dark:bg-gray-800'
                    : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                }`}
                onClick={() => handleTimeChange(item.id)}
              >
                <span className='text-gray-900 dark:text-gray-100'>{item.label}</span>
                {pendingTimeId === item.id && (
                  <svg
                    className='h-5 w-5 text-gray-900 dark:text-white'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M5 13l4 4L19 7' />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>

        <button
          className='btn mt-8 w-full rounded-lg bg-gray-900 py-3 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? '...' : t('common.confirm')}
        </button>
      </div>
    </div>
  );
}
