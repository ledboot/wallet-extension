import { useEffect, useState } from 'react';
import { Check, ChevronDown, Copy, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/ui/utils';
import { Account } from '@/shared/types';

export function WalletHeader() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
  const [shortAddress, setShortAddress] = useState('');

  useEffect(() => {
    if (currentAccount) {
      setShortAddress(`${currentAccount.address.slice(0, 6)}...${currentAccount.address.slice(-4)}`);
    }
  }, [currentAccount]);

  useEffect(() => {
    const init = async () => {
      const account = await wallet.getCurrentAccount();
      console.log('account', account);
      setCurrentAccount(account);
    };
    init();
  }, [wallet]);

  const [copied, setCopied] = useState(false);
  const copyAddress = () => {
    if (!currentAccount) return;
    navigator.clipboard.writeText(currentAccount.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className='w-full sticky top-0 z-10 border-border flex items-center justify-between border-b p-4'>
      <div className='flex items-center space-x-3'>
        <div className='flex h-8 w-8 items-center justify-center rounded-full'>
          <span className='text-primary-foreground text-sm font-bold'>N</span>
        </div>
        <div>
          <button
            onClick={() => navigate('/accounts')}
            className='btn btn-ghost flex items-center space-x-1 text-sm font-medium transition-colors hover:text-primary'
          >
            <span>{currentAccount?.alianName || ''}</span>
            <ChevronDown className='text-muted-foreground h-4 w-4' />
          </button>
          <button
            onClick={copyAddress}
            className='text-muted-foreground hover:text-foreground flex items-center space-x-1 text-xs transition-colors'
          >
            <span>{shortAddress}</span>
            {copied ? (
              <Check className='h-3 w-3 text-success' />
            ) : (
              <Copy className='h-3 w-3' />
            )}
          </button>
        </div>
      </div>
      <button className='btn btn-ghost btn-sm'>
        <Settings className='h-4 w-4' />
      </button>
    </div>
  );
}
