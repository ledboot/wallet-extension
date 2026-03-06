import { useState } from 'react';
import { Wallet } from 'lucide-react';

import { CHAIN_INFO } from '@/shared/constants';
import { useLanguage } from '@/ui/contexts/LanguageContext';
import {
  useAssetsLoading,
  useChainType,
  useCurrentAccount,
  useCurrentAssets,
  useCurrentChainName,
} from '@/ui/state/hooks';

// NFT tab is a placeholder until real NFT data is available
const nfts = [
  {
    id: 'nft1',
    name: 'Bored Ape #1234',
    collection: 'Bored Ape Yacht Club',
    image: '🦧',
    floorPrice: '25.5 ETH',
    lastSale: '28.2 ETH',
  },
  {
    id: 'nft2',
    name: 'CryptoPunk #5678',
    collection: 'CryptoPunks',
    image: '👾',
    floorPrice: '15.8 ETH',
    lastSale: '16.1 ETH',
  },
  {
    id: 'nft3',
    name: 'Doodle #9012',
    collection: 'Doodles',
    image: '🎨',
    floorPrice: '8.2 ETH',
    lastSale: '8.5 ETH',
  },
];

export function AssetList() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'crypto' | 'nft'>('crypto');

  // 当前账户 address + 当前链 chainId，用于从 keyringsStore 索引正确的资产
  const currentAccount = useCurrentAccount();
  const chainType = useChainType();
  const chainId = CHAIN_INFO[chainType]?.chainId ?? 0;
  const address = currentAccount?.address ?? '';

  // 直接订阅 keyringsStore 中对应 address:chainId 的资产数据
  // 切换账户或网络后自动响应，无需监听任何事件
  const assets = useCurrentAssets(address, chainId);
  const chainName = useCurrentChainName(address, chainId);
  const loading = useAssetsLoading();

  if (loading) {
    return <div className='p-4 text-center'>{t('assets.loading')}</div>;
  }

  return (
    <div className='flex h-full w-full flex-col bg-white'>
      <div className='px-4 pb-2 pt-2'>
        <div className='flex w-full space-x-1 rounded-full bg-gray-100 p-1'>
          <button
            className={`flex-1 rounded-full py-2 text-sm font-medium transition-all ${
              activeTab === 'crypto'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('crypto')}
          >
            {t('assets.crypto')}
          </button>
          <button
            className={`flex-1 rounded-full py-2 text-sm font-medium transition-all ${
              activeTab === 'nft'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
            onClick={() => setActiveTab('nft')}
          >
            {t('assets.nft')}
          </button>
        </div>
      </div>

      <div className='hide-scrollbar flex-1 overflow-y-auto px-4 pb-4 pt-2'>
        {/* Crypto Tab */}
        {activeTab === 'crypto' && (
          <div className='mt-2'>
            <div className='space-y-3'>
              {assets.length === 0 ? (
                <div className='flex h-64 flex-col items-center justify-center p-4 text-center'>
                  <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50'>
                    <Wallet className='h-8 w-8 text-gray-400' />
                  </div>
                  <div className='mb-2 text-lg font-medium text-gray-900'>
                    {t('assets.no_tokens_found')}
                  </div>
                  <div className='text-sm text-gray-500'>
                    {t('assets.no_tokens_description')}
                  </div>
                </div>
              ) : (
                assets.map((asset) => (
                  <div
                    key={asset.tokenType}
                    className='cursor-pointer rounded-2xl bg-gray-50 p-4 transition-colors hover:bg-gray-100 active:bg-gray-200'
                  >
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center space-x-3'>
                        <div className='flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white'>
                          <img
                            src={asset.iconHtml}
                            alt={asset.name || t('assets.token_icon')}
                            className='h-full w-full object-cover'
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                '/images/default-token.png';
                            }}
                          />
                        </div>
                        <div>
                          <div className='text-base font-semibold text-gray-900'>
                            {asset.name}
                          </div>
                          <div className='text-xs font-medium text-gray-500'>
                            {chainName}
                          </div>
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='text-base font-semibold text-gray-900'>
                          {(asset.value / 1e8).toFixed(8)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* NFT Tab */}
        {activeTab === 'nft' && (
          <div className='mt-2'>
            <div className='space-y-3'>
              {nfts.map((nft) => (
                <div
                  key={nft.id}
                  className='cursor-pointer rounded-2xl bg-gray-50 p-4 transition-colors hover:bg-gray-100 active:bg-gray-200'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl shadow-sm'>
                        {nft.image}
                      </div>
                      <div>
                        <div className='text-sm font-semibold text-gray-900'>
                          {nft.name}
                        </div>
                        <div className='text-xs font-medium text-gray-500'>
                          {nft.collection}
                        </div>
                      </div>
                    </div>
                    <div className='text-right'>
                      <div className='text-sm font-semibold text-gray-900'>
                        Floor: {nft.floorPrice}
                      </div>
                      <div className='text-xs font-medium text-gray-500'>
                        Last: {nft.lastSale}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
