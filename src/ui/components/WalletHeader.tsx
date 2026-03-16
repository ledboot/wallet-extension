import { useEffect, useState } from 'react';
import { Check, ChevronDown, Copy, Globe, Lock, Settings } from 'lucide-react';
import { toast } from 'sonner';

import { PixelAvatar } from '@/ui/components/PixelAvatar';
import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useCurrentAccount } from '@/ui/state/hooks';
import { useWallet } from '@/ui/utils';

export function WalletHeader() {
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const { t } = useLanguage();
  const wallet = useWallet();
  const [shortAddress, setShortAddress] = useState('');

  useEffect(() => {
    if (currentAccount) {
      setShortAddress(`${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`);
    }
  }, [currentAccount]);

  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (!currentAccount) return;
    navigator.clipboard.writeText(currentAccount.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success(t('header.address_copied'));
  };

  return (
    <div className='sticky top-0 z-20 flex h-14 w-full items-center justify-between px-4 py-[15px]'>
      <div className='flex items-center space-x-3'>
        <PixelAvatar seed={currentAccount?.address || currentAccount?.key || 'default'} size={32} borderRadius={8} />
        <div>
          <button
            onClick={() => navigate('AccountSelection', { currentAccount: currentAccount })}
            className='flex cursor-pointer items-center space-x-1 text-sm font-medium'
          >
            <span>{currentAccount?.alianName || ''}</span>
            <ChevronDown className='text-muted-foreground h-4 w-4' />
          </button>
          <div className='text-muted-foreground text-xs'>{shortAddress}</div>
        </div>
      </div>
      <div className='flex items-center space-x-2'>
        <div
          className='flex h-7 w-7 cursor-pointer items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700'
          onClick={copyAddress}
          title='Copy Address'
        >
          {copied ? <Check className='h-4 w-4 text-success' /> : <Copy className='h-4 w-4' />}
        </div>
        <div className='group relative flex items-center justify-center'>
          <div title={t('header.settings')}>
            <Settings className='h-7 w-7 cursor-pointer rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700' />
          </div>
          {/* Settings Dropdown */}
          <div className='absolute right-[-4px] top-full z-[100] hidden w-[220px] pt-2 group-hover:block'>
            <div className='flex flex-col rounded-2xl bg-white p-2 shadow-[0_4px_24px_rgba(0,0,0,0.08)] ring-1 ring-gray-100'>
              <button
                onClick={() => navigate('SettingsScreen')}
                className='flex w-full items-center justify-start space-x-3 rounded-xl px-4 py-3 text-[15px] font-medium text-black transition-colors hover:bg-[#F5F5F5]'
              >
                <Settings className='h-5 w-5 text-black' strokeWidth={2} />
                <span>{t('header.settings')}</span>
              </button>
              <button
                onClick={async () => {
                  await wallet.lockWallet();
                }}
                className='flex w-full items-center justify-start space-x-3 rounded-xl px-4 py-3 text-[15px] font-medium text-black transition-colors hover:bg-[#F5F5F5]'
              >
                <Lock className='h-5 w-5 text-black' strokeWidth={2} />
                <span>{t('header.lock_wallet')}</span>
              </button>
            </div>
          </div>
        </div>
        <div
          className='h-7 w-7 cursor-pointer rounded p-1 hover:bg-gray-100'
          onClick={() => navigate('NetworkSelection')}
          title={t('header.network')}
        >
          <Globe className='h-5 w-5' />
        </div>
      </div>
    </div>
  );
}
