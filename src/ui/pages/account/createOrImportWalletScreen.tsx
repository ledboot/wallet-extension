import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { KEYRING_TYPE } from '@/shared/constants';
import { useWallet } from '@/ui/utils';
import { useLanguage } from '@/ui/contexts/LanguageContext';

export default function CreateOrImportWalletScreen() {
  const location = useLocation();
  const { t } = useLanguage();
  const { newWallet, importWallet } = (location.state || {}) as {
    newWallet: boolean;
    importWallet: boolean;
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
      // 显示具体的错误信息
      const errorMessage = t('account.wallet_create_failed').replace('{error}', error?.message || t('common.error'));
      toast.error(errorMessage);
      console.error('Failed to create wallet', error);
      return;
    }
    navigate('/main');
  };

  const handleImportWallet = async () => {
    try {
      await wallet.importPrivateKey(wif);
      toast.success(t('account.wallet_imported_success'));
    } catch (error: any) {
      // 显示具体的错误信息
      const errorMessage = t('account.wallet_import_failed').replace('{error}', error?.message || t('common.error'));
      toast.error(errorMessage);
      console.error('Failed to import wallet', error);
      return;
    }
    navigate('/main');
  };

  useEffect(() => {
    const generatePrePrivateKey = async () => {
      if (newWallet) {
        const { address: preAddress, wif: preWif} =
          await wallet.generatePrePrivateKey(KEYRING_TYPE.SimpleKeyring);
        setAddress(preAddress || '');
        setWIF(preWif || '');
      }
    };
    generatePrePrivateKey();
  }, [newWallet, wallet]);

  return (
    <div className='flex h-screen flex-col items-center justify-center p-4'>
      <div className='mb-4 text-xl font-bold'>
        {newWallet ? t('account.create_wallet_title') : t('account.import_wallet_title')}
      </div>
      {newWallet && (
        <div className='flex w-full flex-col gap-2'>
          <span className='text-sm text-gray-500'>{t('account.wallet_address')}</span>
          <input
            type='text'
            placeholder={t('account.wallet_address')}
            value={address}
            className='input w-full rounded-md'
            disabled={true}
          />
          <span className='text-sm text-gray-500'>{t('account.private_key')}</span>
          <textarea
            placeholder={t('account.private_key')}
            value={wif}
            className='input h-20 w-full resize-none rounded-md'
            disabled={true}
            style={{ whiteSpace: 'pre-line' }}
          />
          <div className='flex items-center gap-2'>
            <input
              type='checkbox'
              className='checkbox'
              checked={isBackup}
              onChange={(e) => setIsBackup(e.target.checked)}
            />
            <label className='label'>{t('account.backup_private_key')}</label>
          </div>
          <button className='btn rounded-md' onClick={handleCreateWallet}>
            {t('common.confirm')}
          </button>
        </div>
      )}
      {importWallet && (
        <div className='flex w-full flex-col gap-2'>
          <textarea
            placeholder={t('account.enter_private_key')}
            className='input h-20 w-full resize-none rounded-md'
            value={wif}
            onChange={(e) => setWIF(e.target.value)}
            style={{ whiteSpace: 'pre-line' }}
          />
          <button className='btn rounded-md' onClick={handleImportWallet}>
            {t('common.confirm')}
          </button>
        </div>
      )}
    </div>
  );
}
