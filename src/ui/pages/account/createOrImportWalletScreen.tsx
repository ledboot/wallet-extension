import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { KEYRING_TYPE } from '@/shared/constants';
import { useCreateWalletCallback } from '@/ui/state/hooks';
import { useWallet } from '@/ui/utils';

export default function CreateOrImportWalletScreen() {
  const location = useLocation();
  const { newWallet, importWallet } = (location.state || {}) as {
    newWallet: boolean;
    importWallet: boolean;
  };
  const [isBackup, setIsBackup] = useState(false);
  const createWallet = useCreateWalletCallback();
  const wallet = useWallet();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [wif, setWIF] = useState('');

  const handleCreateWallet = async () => {
    if (!isBackup) {
      toast.error('Please check the backup box');
      return;
    }
    try {
      await createWallet(wif);
    } catch (error: any) {
      // 显示具体的错误信息
      const errorMessage = error?.message || 'Failed to create wallet';
      toast.error(errorMessage);
      console.error('Failed to create wallet', error);
      return;
    }
    navigate('/main');
  };

  const handleImportWallet = async () => {
    try {
      await wallet.createKeyringWithPrivateKey(wif);
      toast.success('Wallet imported successfully');
    } catch (error: any) {
      // 显示具体的错误信息
      const errorMessage = error?.message || 'Failed to import wallet';
      toast.error(errorMessage);
      console.error('Failed to import wallet', error);
      return;
    }
    navigate('/main');
  };

  useEffect(() => {
    const generatePrePrivateKey = async () => {
      if (newWallet) {
        const { address: preAddress, wif: preWIF } = await wallet.generatePrePrivateKey(KEYRING_TYPE.SimpleKeyring);
        setAddress(preAddress);
        setWIF(preWIF);
      }
    };
    generatePrePrivateKey();
  }, [newWallet, wallet]);

  return (
    <div className='flex h-screen flex-col items-center justify-center p-4'>
      <div className='mb-4 text-xl font-bold'>
        {newWallet ? 'Create Wallet' : 'Import Wallet'}
      </div>
      {newWallet && (
        <div className='flex w-full flex-col gap-2'>
          <span className='text-sm text-gray-500'>Wallet Address</span>
          <input
            type='text'
            placeholder='Wallet Address'
            value={address}
            className='input w-full rounded-md'
            disabled={true}
          />
          <span className='text-sm text-gray-500'>WIF</span>
          <textarea
            placeholder='WIF'
            value={wif}
            className='input h-20 w-full resize-none rounded-md'
            disabled={true}
            style={{ whiteSpace: 'pre-line' }}
          />
          <div className='flex items-center gap-2'>
            <input type='checkbox' className='checkbox' checked={isBackup} onChange={(e) => setIsBackup(e.target.checked)} />
            <label className='label'>I backup my private key</label>
          </div>
          <button className='btn rounded-md' onClick={handleCreateWallet}>
            Confirm
          </button>
        </div>
      )}
      {importWallet && (
        <div className='flex w-full flex-col gap-2'>
          <textarea
            placeholder='Enter a private key'
            className='input h-20 w-full resize-none rounded-md'
            value={wif}
            onChange={(e) => setWIF(e.target.value)}
            style={{ whiteSpace: 'pre-line' }}
          />
          <button className='btn rounded-md' onClick={handleImportWallet}>
            Confirm
          </button>
        </div>
      )}
    </div>
  );
}
