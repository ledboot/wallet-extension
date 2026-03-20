import { useState } from 'react';
import { toast } from 'sonner';

import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useWallet } from '@/ui/utils';

import { useNavigate } from '../MainRoute';

export default function UnlockScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [password, setPassword] = useState('');
  const wallet = useWallet();
  const handleUnlock = async () => {
    try {
      await wallet.unlock(password);
      const hasVault = await wallet.hasVault();
      if (hasVault) {
        navigate('MainScreen');
        return;
      } else {
        navigate('WelcomeScreen');
      }
    } catch (error: any) {
      const errorMessage = t('password.unlock_failed').replace('{error}', error.message || t('common.error'));
      toast.error(errorMessage);
    }
  };
  return (
    <div className='flex h-full w-full flex-col items-center justify-center bg-white px-6 pb-20 pt-10'>
      <div className='mb-8 text-center'>
        <h1 className='text-3xl font-bold text-gray-900'>{t('password.unlock_title')}</h1>
        <p className='mt-2 text-sm text-gray-500'>{t('password.unlock_subtitle')}</p>
      </div>

      <div className='w-full space-y-6'>
        <input
          type='password'
          required
          placeholder={t('password.password_placeholder')}
          minLength={8}
          className='w-full rounded-2xl bg-gray-50 p-4 text-base font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300'
          pattern='(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}'
          title={t('password.password_requirements')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleUnlock();
            }
          }}
        />
        <button
          className='w-full rounded-full bg-gray-900 py-4 font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2'
          onClick={handleUnlock}
        >
          {t('password.unlock_button')}
        </button>
      </div>
    </div>
  );
}
