import { X } from 'lucide-react';
import { useLocation } from 'react-router';

import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useWallet } from '@/ui/utils/walletContext';

import { useNavigate } from '../MainRoute';

export default function WelcomeScreen() {
  const wallet = useWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { fromBoost } = (location.state as any) || {};

  const handleCreateWallet = async () => {
    const isBooted = await wallet.isBooted();
    if (isBooted) {
      navigate('CreateOrImportWalletScreen', { newWallet: true });
    } else {
      navigate('CreatePasswordScreen', { newWallet: true });
    }
  };

  const handleImportWallet = async () => {
    const isBooted = await wallet.isBooted();
    if (isBooted) {
      navigate('CreateOrImportWalletScreen', { importWallet: true });
    } else {
      navigate('CreatePasswordScreen', { importWallet: true });
    }
  };

  const handleClose = () => {
    navigate('MainScreen');
  };

  return (
    <div className='relative flex h-screen flex-col bg-base-100'>
      <div className='flex h-14 w-full items-center px-4'>
        <div className='w-9'></div>
        <div className='flex-1'></div>
        {!fromBoost && (
          <button
            onClick={handleClose}
            className='-mr-2 flex items-center justify-center rounded-full p-2 transition-colors hover:bg-base-200'
          >
            <X className='h-5 w-5 text-base-content' />
          </button>
        )}
      </div>

      <div className='flex flex-1 flex-col items-center justify-center px-6'>
        <img src='/zentlogo.png' alt='ZENT Logo' className='mb-6 h-20 w-20 rounded-2xl object-contain' />

        <h1 className='mb-2 text-center text-2xl font-bold tracking-tight text-base-content'>{t('welcome.title')}</h1>

        <p className='text-base-content/60 mb-10 text-center text-sm'>{t('welcome.subtitle')}</p>

        <div className='flex w-full max-w-xs flex-col gap-3'>
          <button
            className='btn w-full rounded-full border-none bg-gray-900 py-6 text-base font-semibold text-white hover:bg-gray-800'
            onClick={handleCreateWallet}
          >
            {t('account.create_wallet')}
          </button>

          <button
            className='btn w-full rounded-full border-none bg-base-200 py-6 text-base font-semibold text-base-content hover:bg-base-300'
            onClick={handleImportWallet}
          >
            {t('account.import_wallet')}
          </button>
        </div>
      </div>

      <div className='text-base-content/40 pb-8 text-center text-xs'>{t('welcome.footer')}</div>
    </div>
  );
}
