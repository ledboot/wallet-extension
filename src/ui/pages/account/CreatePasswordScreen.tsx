import { useEffect, useState } from 'react';
import { useLocation } from 'react-router';

import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useWallet, useWalletRequest } from '@/ui/utils';

import { useNavigate } from '../MainRoute';

export default function CreatePasswordScreen() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const location = useLocation();
  const { t } = useLanguage();
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
      <div className='mb-4 text-xl font-bold'>
        {t('password.create_password')}
      </div>
      <div className='flex flex-col gap-2'>
        <input
          type='password'
          className='input rounded-md'
          required
          placeholder={t('password.password_placeholder')}
          minLength={8}
          pattern='(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}'
          title={t('password.password_requirements')}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type='password'
          className='input rounded-md'
          required
          placeholder={t('password.confirm_password_placeholder')}
          minLength={8}
          pattern='(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}'
          title={t('password.password_requirements')}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <button
          className='btn rounded-md'
          onClick={handleContinue}
          disabled={disabled}
        >
          {t('password.continue')}
        </button>
      </div>
    </div>
  );
}
