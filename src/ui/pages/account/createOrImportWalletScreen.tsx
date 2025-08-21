import { keyringService } from '@/background/service';
import { KEYRING_TYPE } from '@/shared/constants';
import { useCreateWalletCallback } from '@/ui/state/hooks';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function CreateOrImportWalletScreen() {
  const location = useLocation();
  const { newWallet, importWallet } = (location.state || {}) as {
    newWallet: boolean;
    importWallet: boolean;
  };
  const createWallet = useCreateWalletCallback();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [wif, setWIF] = useState('');

  const handleCreateWallet = async () => {
    await createWallet(wif);
    navigate('/main');
  };

  const handleImportWallet = () => {
    keyringService.importPrivateKey(wif);
  };

  useEffect(() => {
    const generatePrePrivateKey = async () => {
    if (newWallet) {
      const KeyringClass = keyringService.getKeyringClassForType(KEYRING_TYPE.SimpleKeyring);
      if (KeyringClass) {
          const keyringInstance = new KeyringClass();
          const {address: preAddress, wif: preWIF} = await keyringService.generatePrePrivateKey(keyringInstance);
          console.log('preAddress', preAddress);
          console.log('preWIF', preWIF);
          setAddress(preAddress);
          setWIF(preWIF);
        }
      }
    };
    generatePrePrivateKey();
  }, [newWallet]);

  return (
    <div className='flex h-screen flex-col items-center justify-center p-4'>
      <div className='mb-4 text-xl font-bold'>
        {newWallet ? 'Create Wallet' : 'Import Wallet'}
      </div>
      {newWallet && (
        <div className='flex flex-col gap-2 w-full'>
          <span className='text-sm text-gray-500'>Wallet Address</span>
          <input
            type='text'
            placeholder='Wallet Address'
            value={address}
            className='input rounded-md w-full'
            disabled={true}
          />
          <span className='text-sm text-gray-500'>WIF</span>
          <textarea
            placeholder='WIF'
            value={wif}
            className='input rounded-md w-full h-20 resize-none'
            disabled={true}
            style={{ whiteSpace: 'pre-line' }}
          />
          <div className='flex items-center gap-2'>
            <input type='checkbox' className='checkbox' />
            <label className='label'>I backup my private key</label>
          </div>
          <button className='btn rounded-md' onClick={handleCreateWallet}>
            Confirm
          </button>
        </div>
      )}
      {importWallet && (
        <div className='flex flex-col gap-2 w-full'>
          <input
            type='text'
            placeholder='Wallet Name'
            className='input rounded-md'
          />
          <textarea
            placeholder='Enter a private key'
            className='input rounded-md w-full h-20 resize-none'
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
