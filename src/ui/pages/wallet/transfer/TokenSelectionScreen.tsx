import { ChevronLeft, ChevronRight, Wallet } from 'lucide-react';
import { useNavigate } from '@/ui/pages/mainRoute';
import { useCurrentAccount, useChainType } from '@/ui/state/hooks';
import { CHAIN_INFO } from '@/shared/constants';
import { useEffect, useState } from 'react';
import { formatAmount } from '@/ui/utils';
import { useWallet } from '@/ui/utils/walletContext';
import type { UtxoAddressSumInfo, CoinNames } from '@/shared/types';

export default function TokenSelectionScreen() {
  const navigate = useNavigate();
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
        const {assetsData, chainName} = await wallet.assetsListsPage();
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
    <div className="h-screen flex flex-col">
      <div className='w-full sticky top-0 z-20 flex h-14 items-center justify-between px-4 py-[15px] bg-wallet-bg'>
        <button 
          onClick={() => navigate('#back')} 
          className='flex items-center space-x-1 text-sm font-medium'
        >
          <ChevronLeft className='h-5 w-5' />
          <span>返回</span>
        </button>
        <h1 className='text-lg font-semibold'>选择代币</h1>
        <div className='w-10' />
      </div>

      <div className="flex-1 overflow-y-auto bg-wallet-bg">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : tokens.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 p-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>
            <div className="text-gray-400 text-lg font-medium mb-2">没有找到代币</div>
            <div className="text-gray-500 text-sm">您当前没有可用的代币</div>
          </div>
        ) : (
          <div className="px-4 py-2">
            {tokens.map((token, index) => (
              <div 
                key={index}
                onClick={() => handleTokenSelect(token)}
                className="flex items-center justify-between p-4 mb-2 bg-wallet-card rounded-xl border border-border active:bg-wallet-card/80 transition-colors"
              >
                <div className="flex items-center">
                  <img 
                    src={token.iconHtml} 
                    alt={token.name} 
                    className="w-10 h-10 rounded-full mr-3"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = 'https://via.placeholder.com/40';
                    }}
                  />
                  <div>
                    <div className="font-medium">{token.name}</div>
                    <div className="text-xs text-gray-400">{token.chainLabel}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatAmount(token.value)}</div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
