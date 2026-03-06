import { useEffect, useState } from 'react';
import type { transferAddressHistory } from '@/shared/types';
import { useNavigate } from '@/ui/pages/MainRoute';
import { ChevronLeft, Clock, Copy, X } from 'lucide-react';
import { useLocation } from 'react-router';
import { toast } from 'sonner';

import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useCurrentAccount } from '@/ui/state/hooks';
import { useWallet } from '@/ui/utils/walletContext';

interface LocationState {
  token: any;
}

export default function RecipientAddressScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentAccount = useCurrentAccount();
  const { t } = useLanguage();
  const { token } = (location.state || {}) as LocationState;

  const [recipientAddress, setRecipientAddress] = useState('');
  const [recentAddresses, setRecentAddresses] = useState<
    transferAddressHistory[]
  >([]);
  const [isValidAddress, setIsValidAddress] = useState(false);
  const wallet = useWallet();

  // Mock recent addresses - in a real app, this would come from a service
  useEffect(() => {
    const fetchRecentAddresses = async () => {
      try {
        const addresses = await wallet.getTransferAddressHistory();
        // 按 updated 从大到小排序
        const sortedAddresses = [...addresses].sort((a, b) => {
          const timeA = a.updated || 0;
          const timeB = b.updated || 0;
          return timeB - timeA; // 降序排序
        });
        setRecentAddresses(sortedAddresses);
      } catch (error) {
        console.error('Failed to fetch recent addresses:', error);
        setRecentAddresses([]); // Set to empty array or handle error appropriately
      }
    };
    fetchRecentAddresses();
  }, [wallet]);

  const formatAddress = (address: string): string => {
    if (!address || address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRecipientAddress(text.trim());
      validateAddress(text.trim());
    } catch (err) {
      toast.error(t('transfer.clipboard_error'));
    }
  };

  const validateAddress = (address: string) => {
    // TODO: Implement actual address validation based on token type
    const isValid = address.length > 20; // Simple validation for demo
    setIsValidAddress(isValid);
    return isValid;
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setRecipientAddress(value);
    validateAddress(value);
  };

  const handleContinue = () => {
    if (!isValidAddress) return;

    navigate('AmountInputScreen', {
      token,
      recipientAddress,
    });
  };

  const selectRecentAddress = (address: string) => {
    setRecipientAddress(address);
    validateAddress(address);
  };

  if (!token) {
    navigate('TokenSelectionScreen');
    return null;
  }

  return (
    <div className='flex h-full w-full flex-col bg-white'>
      <div className='absolute left-0 top-0 z-10 flex h-14 w-full items-center justify-between border-b border-gray-100 bg-white px-4'>
        <button
          onClick={() => navigate('#back')}
          className='-ml-2 flex items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-100'
        >
          <ChevronLeft className='h-5 w-5 text-gray-800' />
        </button>
        <h1 className='absolute left-1/2 -translate-x-1/2 transform text-lg font-semibold text-gray-900'>
          {t('transfer.send_token').replace('{token}', token.name)}
        </h1>
        <button
          onClick={() => navigate('MainScreen')}
          className='-mr-2 flex items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-100'
        >
          <X className='h-5 w-5 text-gray-800' />
        </button>
      </div>

      <div className='hide-scrollbar flex-1 overflow-y-auto bg-white px-4 pb-6 pt-20'>
        <div className='mb-6'>
          <div className='relative'>
            <input
              type='text'
              value={recipientAddress}
              onChange={handleAddressChange}
              placeholder={t('transfer.enter_address').replace(
                '{token}',
                token.name
              )}
              className='w-full rounded-2xl bg-gray-50 p-4 pr-12 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary'
            />
            <button
              onClick={handlePaste}
              className='absolute right-4 top-1/2 -translate-y-1/2 transform text-gray-400 hover:text-gray-600'
              title={t('transfer.paste_address')}
            >
              <Copy className='h-5 w-5' />
            </button>
          </div>

          {!isValidAddress && recipientAddress && (
            <p className='mt-2 text-sm text-red-500'>
              {t('transfer.invalid_address')}
            </p>
          )}
        </div>

        {recentAddresses.length > 0 && (
          <div className='mb-6'>
            <h3 className='mb-3 text-sm font-semibold text-gray-900'>
              {t('transfer.recent_used')}
            </h3>
            <div className='space-y-3'>
              {recentAddresses.map((item, index) => (
                <div
                  key={index}
                  onClick={() => selectRecentAddress(item.address)}
                  className='flex cursor-pointer items-center justify-between rounded-2xl bg-gray-50 p-4 transition-colors hover:bg-gray-100 active:bg-gray-200'
                >
                  <div>
                    <div className='text-sm font-semibold text-gray-900'>
                      {item.address
                        ? item.address.substring(0, 6) +
                          '...' +
                          item.address.substring(item.address.length - 4)
                        : ''}
                    </div>
                    <div className='mt-0.5 w-48 truncate font-mono text-xs text-gray-500'>
                      {item.address}
                    </div>
                  </div>
                  <div className='flex items-center text-xs text-gray-400'>
                    <Clock className='mr-1 h-3.5 w-3.5' />
                    {item.updated
                      ? new Date(item.updated).toLocaleDateString()
                      : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className='bg-white px-4 py-6'>
        <button
          onClick={handleContinue}
          disabled={!isValidAddress}
          className={`w-full rounded-full py-3.5 font-medium transition-colors ${
            isValidAddress
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'cursor-not-allowed bg-gray-100 text-gray-400'
          }`}
        >
          {t('transfer.continue')}
        </button>
      </div>
    </div>
  );
}
