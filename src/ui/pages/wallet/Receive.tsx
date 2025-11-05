import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, Copy, Globe } from 'lucide-react';
import { useNavigate } from '@/ui/pages/mainRoute';
import { useCurrentAccount, useChainType } from '@/ui/state/hooks';
import { CHAIN_INFO } from '@/shared/constants';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';

export default function Receive() {
  const navigate = useNavigate();
  const currentAccount = useCurrentAccount();
  const chainType = useChainType();
  const [copied, setCopied] = useState(false);

  const address = currentAccount?.address || '';
  const networkLabel = useMemo(() => CHAIN_INFO[chainType]?.label ?? '', [chainType]);

  useEffect(() => {
    if (!address) return;
  }, [address]);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success('address copied');
  };

  return (
    <div className="h-screen flex flex-col">
      <div className='w-full sticky top-0 z-20 flex h-14 items-center justify-between px-4 py-[15px]'>
        <button onClick={() => navigate('#back')} className='flex items-center space-x-1 text-sm font-medium'>
          <ChevronLeft className='h-5 w-5' />
          <span>Back</span>
        </button>
        <div className='flex items-center space-x-2 text-sm'>
          <Globe className='h-4 w-4' />
          <span>{networkLabel}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar">
        <div className="px-6 pb-8 flex flex-col items-center">
          <div className='mt-2' />

          <div className='bg-white p-4 rounded-xl shadow border border-border'>
            <QRCodeCanvas value={address} size={192} includeMargin={true} level='M' />
          </div>

          <div className='mt-6 w-full'>
            <div className='text-xs text-muted-foreground mb-1'>Wallet Address</div>
            <div className='flex items-center justify-between bg-wallet-card border border-border rounded-lg p-3'>
              <div className='text-sm break-all mr-3'>{address}</div>
              <button onClick={copyAddress} className='text-muted-foreground hover:text-foreground flex items-center space-x-1 text-xs'>
                {copied ? <Check className='h-4 w-4 text-success' /> : <Copy className='h-4 w-4' />}
              </button>
            </div>
          </div>

          <div className='mt-4 w-full'>
            <div className='text-xs text-muted-foreground mb-1'>Network</div>
            <div className='bg-wallet-card border border-border rounded-lg p-3 text-sm'>
              {networkLabel}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
