import { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useLocation } from 'react-router';

import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useWallet, useWalletRequest } from '@/ui/utils';

import { useNavigate } from '../MainRoute';

export default function CreatePasswordScreen() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const location = useLocation();
  const { t } = useLanguage();
  const { newWallet, importWallet, fromWalletSelection } = (location.state || {}) as {
    newWallet: boolean;
    importWallet: boolean;
    fromWalletSelection?: boolean;
  };
  const MIN_PASSWORD_LENGTH = 8;
  const [disabled, setDisabled] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setDisabled(true);

    if (newPassword && newPassword.length >= MIN_PASSWORD_LENGTH && newPassword === confirmPassword) {
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
    <div className='flex h-screen flex-col bg-base-100'>
      <div className='flex h-14 w-full items-center border-b border-base-200 bg-base-100 px-4'>
        <button
          onClick={() => navigate('WelcomeScreen', { fromWalletSelection })}
          className='-ml-2 flex items-center justify-center rounded-full p-2 transition-colors hover:bg-base-200'
        >
          <ChevronLeft className='h-5 w-5 text-base-content' />
        </button>
        <h1 className='absolute left-1/2 -translate-x-1/2 transform text-lg font-semibold text-base-content'>
          {t('password.create_password')}
        </h1>
        <div className='w-9'></div>
      </div>

      <div className='flex flex-1 flex-col items-center justify-center px-6'>
        <div className='mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-base-200'>
          <svg
            className='h-7 w-7 text-blue-500'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <rect x='3' y='11' width='18' height='11' rx='2' ry='2' />
            <path d='M7 11V7a5 5 0 0 1 10 0v4' />
          </svg>
        </div>

        <p className='text-base-content/60 mb-8 text-center text-sm'>{t('password.password_requirements')}</p>

        <div className='mb-6 flex w-full flex-col gap-4'>
          <div className='relative'>
            <input
              type={showPassword ? 'text' : 'password'}
              className='input-bordered input w-full bg-base-200 py-6 pl-4 pr-12 text-base'
              placeholder={t('password.password_placeholder')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <button
              type='button'
              className='btn btn-ghost btn-sm absolute right-2 top-1/2 -translate-y-1/2 px-2'
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg className='h-5 w-5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                  <path d='M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24' />
                  <line x1='1' y1='1' x2='23' y2='23' />
                </svg>
              ) : (
                <svg className='h-5 w-5' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2'>
                  <path d='M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' />
                  <circle cx='12' cy='12' r='3' />
                </svg>
              )}
            </button>
          </div>

          <div className='relative'>
            <input
              type={showPassword ? 'text' : 'password'}
              className='input-bordered input w-full bg-base-200 py-6 pl-4 pr-12 text-base'
              placeholder={t('password.confirm_password_placeholder')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <div className='pointer-events-none absolute right-4 top-1/2 -translate-y-1/2'>
              {confirmPassword &&
                (newPassword === confirmPassword ? (
                  <svg
                    className='h-5 w-5 text-green-500'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                  >
                    <polyline points='20 6 9 17 4 12' />
                  </svg>
                ) : (
                  <svg
                    className='h-5 w-5 text-red-500'
                    viewBox='0 0 24 24'
                    fill='none'
                    stroke='currentColor'
                    strokeWidth='2'
                  >
                    <line x1='18' y1='6' x2='6' y2='18' />
                    <line x1='6' y1='6' x2='18' y2='18' />
                  </svg>
                ))}
            </div>
          </div>
        </div>

        <button
          className='disabled:text-base-content/40 btn w-full rounded-full border-none bg-gray-900 py-6 text-base font-semibold text-white hover:bg-gray-800 disabled:bg-base-300'
          onClick={handleContinue}
          disabled={disabled}
        >
          {t('password.continue')}
        </button>
      </div>
    </div>
  );
}
