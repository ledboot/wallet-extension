import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

import { useWallet, useWalletRequest } from '@/ui/utils';

import { useNavigate } from '../mainRoute';

export default function CreatePasswordScreen() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const location = useLocation();
  const { newWallet, importWallet } = (location.state || {}) as {
    newWallet: boolean;
    importWallet: boolean;
  };
  const MIN_PASSWORD_LENGTH = 8;
  const [disabled, setDisabled] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    setDisabled(true);

    if (
      newPassword &&
      newPassword.length >= MIN_PASSWORD_LENGTH &&
      newPassword === confirmPassword
    ) {
      setDisabled(false);
      return;
    }
  }, [newPassword, confirmPassword]);

  const [run] = useWalletRequest(wallet.boot, {
    onSuccess: () => {
      navigate('CreateOrImportWalletScreen', {
        importWallet: importWallet,
        newWallet: newWallet,
      });
    },
    onError: (err) => {
      console.log('error', err);
    },
  });

  const handleContinue = () => {
    run(newPassword.trim());
  };

  return (
    <div className='flex h-full flex-col items-center justify-center'>
      <div className='mb-4 text-xl font-bold'>Create Password</div>
      <div className='flex flex-col gap-2'>
        <input
          type='password'
          className='input rounded-md'
          required
          placeholder='Password'
          minLength={8}
          pattern='(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}'
          title='Must be more than 8 characters, including number, lowercase letter, uppercase letter'
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type='password'
          className='input rounded-md'
          required
          placeholder='Confirm Password'
          minLength={8}
          pattern='(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}'
          title='Must be more than 8 characters, including number, lowercase letter, uppercase letter'
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button
          className='btn rounded-md'
          onClick={handleContinue}
          disabled={disabled}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
