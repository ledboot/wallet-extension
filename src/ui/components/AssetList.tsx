interface Asset {
  id: string;
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  change24h: number;
  icon: string;
}

interface NFT {
  id: string;
  name: string;
  collection: string;
  image: string;
  floorPrice: string;
  lastSale: string;
}

const assets: Asset[] = [
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    balance: '12.45678',
    usdValue: '31,234.56',
    change24h: 2.34,
    icon: '⟠',
  },
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    balance: '1,250.00',
    usdValue: '1,250.00',
    change24h: 0.01,
    icon: '💵',
  },
  {
    id: 'uni',
    symbol: 'UNI',
    name: 'Uniswap',
    balance: '45.28',
    usdValue: '567.89',
    change24h: -1.23,
    icon: '🦄',
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    balance: '12.45678',
    usdValue: '31,234.56',
    change24h: 2.34,
    icon: '⟠',
  },
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    balance: '1,250.00',
    usdValue: '1,250.00',
    change24h: 0.01,
    icon: '💵',
  },
  {
    id: 'uni',
    symbol: 'UNI',
    name: 'Uniswap',
    balance: '45.28',
    usdValue: '567.89',
    change24h: -1.23,
    icon: '🦄',
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    balance: '12.45678',
    usdValue: '31,234.56',
    change24h: 2.34,
    icon: '⟠',
  },
  {
    id: 'usdc',
    symbol: 'USDC',
    name: 'USD Coin',
    balance: '1,250.00',
    usdValue: '1,250.00',
    change24h: 0.01,
    icon: '💵',
  },
  {
    id: 'uni',
    symbol: 'UNI',
    name: 'Uniswap',
    balance: '45.28',
    usdValue: '567.89',
    change24h: -1.23,
    icon: '🦄',
  },
];

const nfts: NFT[] = [
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

import { useState } from 'react';

export function AssetList() {
  const [activeTab, setActiveTab] = useState<'crypto' | 'nft'>('crypto');

  return (
    <div className='w-full sticky top-0 z-10 bg-background h-full flex flex-col'>
      <div className='px-4 pt-2 pb-2 border-b border-gray-200'>
        <div className='tabs tabs-border'>
        <a 
          className={`tab ${activeTab === 'crypto' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('crypto')}
        >
          Crypto
        </a>
        <a 
          className={`tab ${activeTab === 'nft' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('nft')}
        >
          NFT
        </a>
        </div>
      </div>
      <div className='flex-1 overflow-y-auto px-4 pb-4 pt-2 hide-scrollbar'>
      {/* Crypto Tab Content */}
      {activeTab === 'crypto' && (
        <div className='mt-4'>
          <div className='space-y-2'>
            {assets.map((asset) => (
              <div
                key={asset.id}
                className='card cursor-pointer border border-base-300 bg-base-100 shadow-sm transition-all hover:shadow-md'
              >
                <div className='card-body p-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='flex h-8 w-8 items-center justify-center rounded-full bg-base-200 text-lg'>
                        {asset.icon}
                      </div>
                      <div>
                        <div className='text-sm font-medium'>{asset.symbol}</div>
                        <div className='text-base-content/60 text-xs'>
                          {asset.name}
                        </div>
                      </div>
                    </div>

                    <div className='text-right'>
                      <div className='text-sm font-medium'>{asset.balance}</div>
                      <div className='flex items-center space-x-1'>
                        <span className='text-base-content/60 text-xs'>
                          ${asset.usdValue}
                        </span>
                        <span
                          className={`text-xs ${
                            asset.change24h >= 0 ? 'text-success' : 'text-error'
                          }`}
                        >
                          {asset.change24h >= 0 ? '+' : ''}
                          {asset.change24h}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NFT Tab Content */}
      {activeTab === 'nft' && (
        <div className='mt-4'>
          <div className='space-y-2'>
            {nfts.map((nft) => (
              <div
                key={nft.id}
                className='card cursor-pointer border border-base-300 bg-base-100 shadow-sm transition-all hover:shadow-md'
              >
                <div className='card-body p-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <div className='flex h-12 w-12 items-center justify-center rounded-lg bg-base-200 text-2xl'>
                        {nft.image}
                      </div>
                      <div>
                        <div className='text-sm font-medium'>{nft.name}</div>
                        <div className='text-base-content/60 text-xs'>
                          {nft.collection}
                        </div>
                      </div>
                    </div>

                    <div className='text-right'>
                      <div className='text-sm font-medium'>Floor: {nft.floorPrice}</div>
                      <div className='text-base-content/60 text-xs'>
                        Last: {nft.lastSale}
                      </div>
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
