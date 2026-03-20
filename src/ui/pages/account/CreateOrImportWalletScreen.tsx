import { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

import { KEYRING_TYPE } from '@/shared/constants';
import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useWallet } from '@/ui/utils';

import { useNavigate } from '../MainRoute';

export default function CreateOrImportWalletScreen() {
  const location = useLocation();
  const { t } = useLanguage();
  const { newWallet, importWallet, fromWalletSelection } = (location.state || {}) as {
    newWallet: boolean;
    importWallet: boolean;
    fromWalletSelection?: boolean;
  };
  const [isBackup, setIsBackup] = useState(false);
  const wallet = useWallet();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [wif, setWIF] = useState('');

  const handleCreateWallet = async () => {
    if (!isBackup) {
      toast.error(t('account.confirm_backup'));
      return;
    }
    try {
      await wallet.importPrivateKey(wif);
      toast.success(t('account.wallet_created_success'));
    } catch (error: any) {
      const errorMessage = t('account.wallet_create_failed').replace('{error}', error?.message || t('common.error'));
      toast.error(errorMessage);
      console.error('Failed to create wallet', error);
      return;
    }
    navigate('MainScreen');
  };

  const handleImportWallet = async () => {
    try {
      await wallet.importPrivateKey(wif);
      toast.success(t('account.wallet_imported_success'));
    } catch (error: any) {
      const errorMessage = t('account.wallet_import_failed').replace('{error}', error?.message || t('common.error'));
      toast.error(errorMessage);
      console.error('Failed to import wallet', error);
      return;
    }
    navigate('MainScreen');
  };

  useEffect(() => {
    const generatePrePrivateKey = async () => {
      if (newWallet) {
        const { address: preAddress, wif: preWif } = await wallet.generatePrePrivateKey(KEYRING_TYPE.SimpleKeyring);
        setAddress(preAddress || '');
        setWIF(preWif || '');
      }
    };
    generatePrePrivateKey();
  }, [newWallet, wallet]);

  return (
    <div className='flex h-screen flex-col bg-base-100'>
      <div className='flex h-14 w-full items-center border-b border-base-200 bg-base-100 px-4'>
        <button
          onClick={() => navigate('WelcomeScreen', { fromWalletSelection })}
          className='-ml-2 flex items-center justify-center rounded-full p-2 transition-colors hover:bg-base-200'
        >
          <ChevronLeft className='h-5 w-5 text-base-content' />
        </button>
        <h1 className='absolute left-1/2 -translate-x-1/2 transform text-lg font-semibold text-base-content'>
          {newWallet ? t('account.create_wallet_title') : t('account.import_wallet_title')}
        </h1>
        <div className='w-9'></div>
      </div>

      <div className='flex flex-1 flex-col px-6 pt-6'>
        {newWallet && (
          <div className='flex flex-col gap-5'>
            <div className='flex flex-col gap-2'>
              <span className='text-base-content/70 text-sm font-medium'>{t('account.wallet_address')}</span>
              <input
                type='text'
                value={address}
                className='input-bordered text-base-content/60 input w-full bg-base-200 py-4 text-sm'
                disabled={true}
              />
            </div>

            <div className='flex flex-col gap-2'>
              <div className='flex items-center justify-between'>
                <span className='text-base-content/70 text-sm font-medium'>{t('account.private_key')}</span>
                <span className='text-base-content/40 text-xs'>{t('account.ensure_privacy')}</span>
              </div>
              <textarea
                value={wif}
                className='textarea-bordered text-base-content/80 textarea h-24 w-full resize-none bg-base-200 font-mono text-sm'
                disabled={true}
                style={{ whiteSpace: 'pre-line' }}
              />
            </div>

            <label className='flex cursor-pointer items-center gap-3 rounded-full bg-base-200 p-4'>
              <input
                type='checkbox'
                className='checkbox checkbox-sm border-gray-400 checked:border-gray-900'
                checked={isBackup}
                onChange={(e) => setIsBackup(e.target.checked)}
              />
              <span className='text-sm text-base-content'>{t('account.backup_private_key')}</span>
            </label>

            <button
              className='btn mt-4 w-full rounded-full border-none bg-gray-900 py-6 text-base font-semibold text-white hover:bg-gray-800'
              onClick={handleCreateWallet}
            >
              {t('common.confirm')}
            </button>
          </div>
        )}

        {importWallet && (
          <div className='flex flex-col gap-5'>
            <div className='flex flex-col gap-2'>
              <span className='text-base-content/70 text-sm font-medium'>{t('account.private_key')}</span>
              <textarea
                placeholder={t('account.enter_private_key')}
                value={wif}
                onChange={(e) => setWIF(e.target.value)}
                className='textarea-bordered textarea h-32 w-full resize-none bg-base-200 font-mono text-sm'
                style={{ whiteSpace: 'pre-line' }}
              />
            </div>

            <button
              className='btn mt-4 w-full rounded-full border-none bg-gray-900 py-6 text-base font-semibold text-white hover:bg-gray-800'
              onClick={handleImportWallet}
            >
              {t('common.confirm')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
