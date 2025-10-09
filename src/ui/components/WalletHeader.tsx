import { useEffect, useState } from 'react';
import { Check, ChevronDown, Copy, Globe, Settings } from 'lucide-react';
import { useNavigate } from '@/ui/pages/mainRoute';
import { useCurrentAccount } from '@/ui/state/hooks';

export function WalletHeader() {
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
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
  };


  return (
    <div className='w-full sticky top-0 z-20 flex h-14 items-center justify-between px-4 py-[15px]'>
      <div className='flex items-center space-x-3'>
        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary'>
          <span className='text-primary-foreground text-sm font-bold'>N</span>
        </div>
        <div>
          <button
            onClick={() => navigate('AccountSelection', { currentAccount: currentAccount })}
            className='flex items-center space-x-1 text-sm font-medium cursor-pointer'
          >
            <span>{currentAccount?.alianName || ''}</span>
            <ChevronDown className='text-muted-foreground h-4 w-4' />
          </button>
          <button
            onClick={copyAddress}
            className='text-muted-foreground hover:text-foreground flex items-center space-x-1 text-xs'
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
      <div className='flex items-center space-x-2'>
        <Settings className='h-7 w-7 p-1 cursor-pointer hover:bg-gray-100 rounded' />
        <Globe className='h-7 w-7 p-1 cursor-pointer hover:bg-gray-100 rounded' onClick={()=>navigate('NetworkSelection')} />
      </div>
    </div>
  );
}
