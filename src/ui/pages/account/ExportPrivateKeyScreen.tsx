import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import { Account } from '@shared/types';
import { AlertTriangle, Check, ChevronLeft, Copy, ShieldAlert, X } from 'lucide-react';
import { useLocation } from 'react-router';
import { toast } from 'sonner';

import { PixelAvatar } from '@/ui/components/PixelAvatar';
import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useWallet } from '@/ui/utils';

const formatCompactValue = (value: string, leading = 10, trailing = 8): string => {
  if (value.length <= leading + trailing) {
    return value;
  }

  return `${value.slice(0, leading)}...${value.slice(-trailing)}`;
};

const maskSensitiveValue = (value: string): string => value.replace(/./g, '•');

export default function ExportPrivateKeyScreen(): ReactElement | null {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const wallet = useWallet();

  const account = (location.state as { account?: Account } | undefined)?.account;

  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [privateKey, setPrivateKey] = useState<string>('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const accountName = useMemo(
    () => account?.alianName?.trim() || (account ? formatCompactValue(account.address, 8, 6) : ''),
    [account]
  );
  const maskedPrivateKey = useMemo(() => maskSensitiveValue(privateKey), [privateKey]);
  const securityTips = useMemo(
    () => [
      t('account.private_key_security_tip_1'),
      t('account.private_key_security_tip_2'),
      t('account.private_key_security_tip_3'),
    ],
    [t]
  );

  useEffect(() => {
    if (!account) {
      navigate('#back');
    }
  }, [account, navigate]);

  useEffect(() => {
    if (!hasCopied) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setHasCopied(false);
    }, 2000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [hasCopied]);

  useEffect(() => {
    if (!isAuthenticated) {
      return undefined;
    }

    const handleVisibilityChange = (): void => {
      if (document.visibilityState !== 'visible') {
        setIsRevealed(false);
      }
    };
    const handleWindowBlur = (): void => {
      setIsRevealed(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isAuthenticated]);

  if (!account) {
    return null;
  }

  const handleAuth = async (): Promise<void> => {
    if (!password.trim()) return;
    setIsLoading(true);
    try {
      await wallet.verifyPassword(password);
      const wif = await wallet.getWIF(account.address);
      setPrivateKey(wif);
      setPassword('');
      setIsRevealed(false);
      setIsAuthenticated(true);
      setHasCopied(false);
    } catch (error: any) {
      toast.error(t('password.unlock_failed').replace('{error}', error.message || t('common.error')));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async (): Promise<void> => {
    if (!privateKey) return;

    try {
      await navigator.clipboard.writeText(privateKey);
      setHasCopied(true);
      toast.success(t('account.private_key_copy_success'));
    } catch (error) {
      console.error('Failed to copy private key:', error);
      toast.error(t('account.private_key_copy_failed'));
    }
  };

  return (
    <div className='relative flex h-full min-h-full w-full flex-col bg-white'>
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

      <div className='hide-scrollbar flex flex-1 flex-col overflow-y-auto px-4 pb-6 pt-20'>
        <div className='flex flex-col pb-6'>
          <div className='flex flex-col items-center border-b border-gray-100 pb-6 text-center'>
            <PixelAvatar seed={account.address || account.key || 'default'} size={64} borderRadius={18} />
            <p className='mt-4 text-xl font-semibold text-gray-900'>{accountName}</p>
            <p className='mt-2 break-all font-mono text-xs leading-5 text-gray-500'>{account.address}</p>
          </div>

          <div className='mt-6 flex items-start rounded-2xl bg-orange-50 p-4'>
            <ShieldAlert className='mt-0.5 h-5 w-5 shrink-0 text-orange-500' />
            <div className='ml-3'>
              <p className='text-sm font-medium text-gray-900'>{t('account.private_key')}</p>
              <p className='mt-1 text-sm leading-6 text-gray-600'>{t('account.private_key_exposure_warning')}</p>
            </div>
          </div>

          {!isAuthenticated ? (
            <form
              className='mt-6 space-y-5'
              onSubmit={(event) => {
                event.preventDefault();
                void handleAuth();
              }}
            >
              <div>
                <h2 className='text-lg font-semibold text-gray-900'>{t('password.enter_password')}</h2>
                <p className='mt-2 text-sm leading-6 text-gray-500'>{t('account.export_private_key_subtitle')}</p>
              </div>

              <div className='space-y-2'>
                <label className='block text-sm font-medium text-gray-700' htmlFor='export-private-key-password'>
                  {t('password.password')}
                </label>
                <input
                  id='export-private-key-password'
                  type='password'
                  required
                  autoFocus
                  placeholder={t('password.password_placeholder')}
                  className='w-full rounded-2xl bg-gray-50 p-4 text-base font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300'
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              <p className='text-sm leading-6 text-gray-500'>{t('account.export_private_key_password_help')}</p>

              <button
                type='submit'
                className='w-full rounded-full bg-gray-900 py-4 font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-gray-300'
                disabled={isLoading || !password.trim()}
              >
                {isLoading ? <span className='loading loading-spinner loading-sm' /> : t('common.confirm')}
              </button>
            </form>
          ) : (
            <div className='mt-6'>
              <div>
                <h2 className='text-lg font-semibold text-gray-900'>{t('account.private_key')}</h2>
                <p className='mt-1 text-sm leading-6 text-gray-500'>{t('account.hover_to_show_private_key')}</p>
              </div>

              <div
                className='mt-4 rounded-2xl bg-gray-50 p-4'
                onMouseEnter={() => setIsRevealed(true)}
                onMouseLeave={() => setIsRevealed(false)}
              >
                <p className='break-all font-mono text-[13px] leading-6 text-gray-900'>
                  {isRevealed ? privateKey : maskedPrivateKey}
                </p>
              </div>

              {!isRevealed && <p className='mt-3 text-sm leading-6 text-gray-500'>{t('account.ensure_privacy')}</p>}

              <div className='mt-6'>
                <button
                  type='button'
                  className='flex w-full items-center justify-center gap-2 rounded-full bg-gray-900 py-4 font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2'
                  onClick={() => void handleCopy()}
                >
                  {hasCopied ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
                  {hasCopied ? t('account.private_key_copy_success') : t('account.copy_private_key')}
                </button>
              </div>

              <div className='mt-8 border-t border-gray-100 pt-6'>
                <div className='flex items-center gap-2 text-sm font-semibold text-gray-900'>
                  <AlertTriangle className='h-4 w-4 text-orange-500' />
                  {t('settings.wallet_security')}
                </div>
                <div className='mt-3 space-y-3'>
                  {securityTips.map((tip) => (
                    <div key={tip} className='flex items-start gap-3 text-sm leading-6 text-gray-600'>
                      <span className='mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-900' />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
