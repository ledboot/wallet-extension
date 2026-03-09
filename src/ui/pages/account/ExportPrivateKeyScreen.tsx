import { useState } from 'react';
import { Account } from '@shared/types';
import { ChevronLeft, Copy, EyeOff, ShieldCheck, X } from 'lucide-react';
import { useLocation } from 'react-router';
import { toast } from 'sonner';

import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useWallet } from '@/ui/utils';

export default function ExportPrivateKeyScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const wallet = useWallet();

  const account = (location.state as any)?.account as Account | undefined;

  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [privateKey, setPrivateKey] = useState<string>('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!account) {
    navigate('#back');
    return null;
  }

  const handleAuth = async () => {
    if (!password) return;
    setLoading(true);
    try {
      await wallet.verifyPassword(password);
      const wif = await wallet.getWIF(account.address);
      setPrivateKey(wif);
      setIsAuthenticated(true);
    } catch (error: any) {
      toast.error(t('password.unlock_failed').replace('{error}', error.message || t('common.error')));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!privateKey) return;
    navigator.clipboard.writeText(privateKey);
    toast.success(t('common.copied'));
  };

  return (
    <div className='flex h-full w-full flex-col bg-[#F5F5F5]'>
      {/* Header */}
      <div className='absolute left-0 top-0 z-10 flex h-14 w-full items-center justify-between border-b border-gray-100 bg-white px-4'>
        <button
          onClick={() => navigate('#back')}
          className='-ml-2 flex items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-100'
        >
          <ChevronLeft className='h-5 w-5 text-gray-800' />
        </button>
        <h1 className='absolute left-1/2 -translate-x-1/2 transform text-lg font-semibold text-gray-900'>
          {t('account.private_key')}
        </h1>
        <button
          onClick={() => navigate('#back')}
          className='-mr-2 flex items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-100'
        >
          <X className='h-5 w-5 text-gray-800' />
        </button>
      </div>

      <div className='flex flex-1 flex-col px-4 pb-6 pt-20'>
        {!isAuthenticated ? (
          <div className='flex flex-col items-center pt-10'>
            <div className='w-full max-w-sm space-y-6 rounded-2xl bg-white p-6 shadow-sm'>
              <h2 className='text-center text-xl font-bold text-gray-900'>
                {t('password.enter_password', 'Enter Password')}
              </h2>
              <input
                type='password'
                required
                placeholder={t('password.password_placeholder')}
                className='w-full rounded-2xl bg-gray-50 p-4 text-base font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAuth();
                  }
                }}
              />
              <button
                className='w-full rounded-full bg-gray-900 py-4 font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:bg-gray-400'
                onClick={handleAuth}
                disabled={loading || !password}
              >
                {loading ? <span className='loading loading-spinner loading-sm' /> : t('common.confirm')}
              </button>
            </div>
          </div>
        ) : (
          <div className='flex flex-col items-center pt-4'>
            {/* Private Key Display Card */}
            <div
              className={`relative mb-8 flex min-h-[160px] w-full cursor-pointer flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all`}
              onMouseEnter={() => setIsRevealed(true)}
              onMouseLeave={() => setIsRevealed(false)}
              onClick={() => setIsRevealed((prev) => !prev)}
            >
              {isRevealed ? (
                <div className='w-full break-all text-left text-lg font-medium text-gray-900'>{privateKey}</div>
              ) : (
                <div className='flex flex-col items-center justify-center text-center'>
                  <EyeOff className='mb-4 h-10 w-10 text-gray-800' strokeWidth={2.5} />
                  <p className='mb-1 font-medium text-gray-900'>{t('account.hover_to_show_private_key')}</p>
                  <p className='text-sm text-gray-600'>{t('account.ensure_privacy')}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className='w-full space-y-4'>
              <button
                className='flex w-full items-center justify-center gap-2 rounded-full bg-black py-4 font-medium text-white transition-colors hover:bg-gray-800'
                onClick={() => handleCopy()}
              >
                <Copy className='h-5 w-5' />
                {t('account.copy')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
