import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, Copy, Globe, X } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { toast } from 'sonner';

import { CHAIN_INFO } from '@/shared/constants';
import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useNavigate } from '@/ui/pages/mainRoute';
import { useChainType, useCurrentAccount } from '@/ui/state/hooks';

export default function Receive() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const currentAccount = useCurrentAccount();
  const chainType = useChainType();
  const [copied, setCopied] = useState(false);

  const address = currentAccount?.address || '';
  const networkLabel = useMemo(
    () => CHAIN_INFO[chainType]?.label ?? '',
    [chainType]
  );

  useEffect(() => {
    if (!address) return;
  }, [address]);

  const copyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
    toast.success(t('receive.address_copied'));
  };

  return (
    <div className='flex h-full w-full flex-col bg-white'>
      <div className='absolute left-0 top-0 z-10 flex h-14 w-full items-center justify-between bg-white px-4'>
        <button
          onClick={() => navigate('#back')}
          className='-ml-2 flex items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-100'
        >
          <ChevronLeft className='h-5 w-5 text-gray-800' />
        </button>
        <h1 className='absolute left-1/2 -translate-x-1/2 transform text-lg font-semibold text-gray-900'>
          {t('assets.receive')}
        </h1>
        <button
          onClick={() => navigate('MainScreen')}
          className='-mr-2 flex items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-100'
        >
          <X className='h-5 w-5 text-gray-800' />
        </button>
      </div>

      <div className='hide-scrollbar flex-1 overflow-y-auto pt-14'>
        <div className='flex flex-col items-center px-6 pb-8 pt-8'>
          <div className='rounded-3xl bg-gray-50 p-6'>
            <QRCodeCanvas
              value={address}
              size={200}
              includeMargin={false}
              level='M'
              className='rounded-xl'
            />
          </div>

          <div className='mt-8 w-full text-center'>
            <h2 className='mb-2 text-sm font-semibold text-gray-900'>
              {t('receive.wallet_address')}
            </h2>
            <div className='rounded-2xl bg-gray-50 p-4'>
              <p className='break-all font-mono text-sm leading-relaxed text-gray-500'>
                {address}
              </p>
            </div>
          </div>

          <div className='mt-4 w-full text-center'>
            <h2 className='mb-2 text-sm font-semibold text-gray-900'>
              {t('receive.network')}
            </h2>
            <div className='rounded-2xl bg-gray-50 p-4'>
              <p className='text-sm font-medium leading-relaxed text-gray-700'>
                {networkLabel}
              </p>
            </div>
          </div>

          <div className='mt-6 w-full'>
            <button
              onClick={copyAddress}
              className='flex w-full items-center justify-center space-x-2 rounded-full bg-gray-900 py-3.5 text-white transition-colors hover:bg-gray-800'
            >
              {copied ? (
                <>
                  <Check className='h-4 w-4' />
                  <span className='text-sm font-medium'>
                    {t('receive.copied')}
                  </span>
                </>
              ) : (
                <>
                  <Copy className='h-4 w-4' />
                  <span className='text-sm font-medium'>
                    {t('receive.copy_address')}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
