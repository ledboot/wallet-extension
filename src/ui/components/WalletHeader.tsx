import { useEffect, useState } from 'react';
import {
  Check,
  ChevronDown,
  Copy,
  Globe,
  RefreshCw,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';

import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useNavigate } from '@/ui/pages/mainRoute';
import { useCurrentAccount } from '@/ui/state/hooks';

interface WalletHeaderProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function WalletHeader({
  onRefresh,
  isRefreshing = false,
}: WalletHeaderProps) {
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const { t } = useLanguage();
  const [shortAddress, setShortAddress] = useState('');

  useEffect(() => {
    if (currentAccount) {
      setShortAddress(
        `${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`
      );
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
        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary'>
          <span className='text-primary-foreground text-sm font-bold'>N</span>
        </div>
        <div>
          <button
            onClick={() =>
              navigate('AccountSelection', { currentAccount: currentAccount })
            }
            className='flex cursor-pointer items-center space-x-1 text-sm font-medium'
          >
            <span>{currentAccount?.alianName || ''}</span>
            <ChevronDown className='text-muted-foreground h-4 w-4' />
          </button>
          <button
            onClick={copyAddress}
            className='text-muted-foreground flex items-center space-x-1 text-xs hover:text-foreground'
          >
            <span>{shortAddress}</span>
            {copied ? (
              <Check className='h-3 w-3 text-success' />
            ) : (
              <Copy className='h-3 w-3' />
            )}
          </button>
        </div>
        <button
          className={`rounded-full p-1.5 ${
            isRefreshing
              ? 'cursor-not-allowed text-gray-400'
              : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
          } transition-colors`}
          onClick={(e) => {
            e.stopPropagation();
            if (onRefresh && !isRefreshing) {
              onRefresh();
            }
          }}
          disabled={isRefreshing}
          title={t('header.refresh')}
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
        </button>
      </div>
      <div className='flex items-center space-x-2'>
        <div title='Settings' onClick={() => navigate('SettingsScreen')}>
          <Settings className='h-7 w-7 cursor-pointer rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700' />
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
