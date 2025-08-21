interface Asset {
  id: string;
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  change24h: number;
  icon: string;
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
];

export function AssetList() {
  return (
    <div className='w-full p-4'>
      <h3 className='text-base-content/60 mb-3 text-sm font-medium'>Assets</h3>
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
  );
}
