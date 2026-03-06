import { useEffect, useState } from 'react';
import { useNavigate } from '@/ui/pages/MainRoute';
import { ChevronLeft, ChevronRight, Wallet, X } from 'lucide-react';

import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useChainType, useCurrentAccount } from '@/ui/state/hooks';
import { formatAmount } from '@/ui/utils';
import { useWallet } from '@/ui/utils/walletContext';

export default function TokenSelectionScreen() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const currentAccount = useCurrentAccount();
  const chainType = useChainType();
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const wallet = useWallet();

  useEffect(() => {
    const loadTokens = async () => {
      try {
        // TODO: Replace with actual token fetching logic
        // This is a mock implementation
        const { assetsData, chainName } = await wallet.assetsListsPage();
        setTokens(assetsData);
      } catch (error) {
        console.error('Failed to load tokens:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTokens();
  }, [currentAccount?.address, chainType]);

  const handleTokenSelect = (token: any) => {
    navigate('RecipientAddressScreen', { token });
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
          {t('transfer.select_token')}
        </h1>
        <button
          onClick={() => navigate('MainScreen')}
          className='-mr-2 flex items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-100'
        >
          <X className='h-5 w-5 text-gray-800' />
        </button>
      </div>

      <div className='hide-scrollbar flex-1 overflow-y-auto bg-white pt-14'>
        {loading ? (
          <div className='flex h-40 items-center justify-center'>
            <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-gray-900'></div>
          </div>
        ) : tokens.length === 0 ? (
          <div className='flex h-64 flex-col items-center justify-center p-4 text-center'>
            <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50'>
              <Wallet className='h-8 w-8 text-gray-400' />
            </div>
            <div className='mb-2 text-lg font-medium text-gray-900'>
              {t('transfer.no_tokens_found')}
            </div>
            <div className='text-sm text-gray-500'>
              {t('transfer.no_tokens_description')}
            </div>
          </div>
        ) : (
          <div className='px-4 pb-8 pt-4'>
            {tokens.map((token, index) => (
              <div
                key={index}
                onClick={() => handleTokenSelect(token)}
                className='mb-3 flex cursor-pointer items-center justify-between rounded-2xl bg-gray-50 p-4 transition-colors hover:bg-gray-100 active:bg-gray-200'
              >
                <div className='flex items-center'>
                  <img
                    src={token.iconHtml}
                    alt={token.name}
                    className='mr-4 h-10 w-10 rounded-full'
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/40';
                    }}
                  />
                  <div>
                    <div className='text-base font-semibold text-gray-900'>
                      {token.name}
                    </div>
                    <div className='text-xs text-gray-500'>
                      {token.chainLabel}
                    </div>
                  </div>
                </div>
                <div className='flex items-center space-x-3'>
                  <div className='text-right'>
                    <div className='text-base font-semibold text-gray-900'>
                      {formatAmount(token.value)}
                    </div>
                  </div>
                  <ChevronRight className='h-5 w-5 text-gray-400' />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
