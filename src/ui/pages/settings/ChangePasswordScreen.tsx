import { useState } from 'react';
import { toast } from 'sonner';

import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useWallet } from '@/ui/utils';

import { useNavigate } from '../MainRoute';

export default function ChangePasswordScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const wallet = useWallet();
  const MIN_PASSWORD_LENGTH = 8;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isValidNewPassword = (password: string): boolean => {
    if (password.length < MIN_PASSWORD_LENGTH) return false;
    const hasNumber = /\d/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    return hasNumber && hasLower && hasUpper;
  };

  const handleSubmit = async () => {
    if (newPassword !== confirmPassword) {
      toast.error(t('password.password_mismatch'));
      return;
    }

    if (!isValidNewPassword(newPassword)) {
      toast.error(t('password.password_requirements'));
      return;
    }

    if (!currentPassword) {
      toast.error(t('settings.incorrect_current_password'));
      return;
    }

    setIsLoading(true);
    try {
      await wallet.changePassword(currentPassword, newPassword);
      toast.success(t('settings.password_changed_success'));
      await wallet.lockWallet();
    } catch (error: any) {
      if (error.message?.includes('Incorrect password')) {
        toast.error(t('settings.incorrect_current_password'));
      } else {
        toast.error(t('settings.password_changed_failed'));
      }
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
          {t('settings.change_password')}
        </h1>
        <div className='w-9'></div>
      </div>

      <div className='hide-scrollbar flex-1 overflow-y-auto px-4 pb-6'>
        <div className='mt-6 space-y-4'>
          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
              {t('settings.current_password')}
            </label>
            <input
              type='password'
              className='input w-full rounded-lg'
              placeholder={t('password.password_placeholder')}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
              {t('settings.new_password')}
            </label>
            <input
              type='password'
              className='input w-full rounded-lg'
              placeholder={t('password.password_placeholder')}
              minLength={8}
              pattern='(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}'
              title={t('password.password_requirements')}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div>
            <label className='mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300'>
              {t('settings.confirm_new_password')}
            </label>
            <input
              type='password'
              className='input w-full rounded-lg'
              placeholder={t('password.confirm_password_placeholder')}
              minLength={8}
              pattern='(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}'
              title={t('password.password_requirements')}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <p className='text-xs text-gray-500 dark:text-gray-400'>{t('password.password_requirements')}</p>
        </div>

        <button
          className='btn mt-8 w-full rounded-lg bg-gray-900 py-3 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? '...' : t('common.confirm')}
        </button>
      </div>
    </div>
  );
}
