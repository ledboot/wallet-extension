import { useState } from 'react';

import { useWallet } from '@/ui/utils';
import { useLanguage } from '@/ui/contexts/LanguageContext';

import { useNavigate } from '../mainRoute';
import { toast } from 'sonner';

export default function UnlockScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [password, setPassword] = useState('12345678');
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
    <div className='flex h-full w-full flex-col items-center justify-center p-4'>
      <div className='text-2xl font-bold'>{t('password.unlock_title')}</div>
      <span className='mb-2 text-sm text-gray-500'>{t('password.unlock_subtitle')}</span>
      <input
        type='password'
        required
        placeholder={t('password.password_placeholder')}
        minLength={8}
        className='w-full rounded-md border border-gray-300 p-2 text-lg'
        pattern='(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}'
        title={t('password.password_requirements')}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button className='btn mt-4 w-full' onClick={handleUnlock}>
        {t('password.unlock_button')}
      </button>
    </div>
  );
}
