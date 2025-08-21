import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ExternalLink,
} from 'lucide-react';

interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'swap';
  amount: string;
  symbol: string;
  to?: string;
  from?: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  hash: string;
}

const transactions: Transaction[] = [
  {
    id: '1',
    type: 'receive',
    amount: '2.5',
    symbol: 'ETH',
    from: '0x1234...5678',
    timestamp: '2 hours ago',
    status: 'completed',
    hash: '0xabc123...',
  },
  {
    id: '2',
    type: 'send',
    amount: '0.1',
    symbol: 'ETH',
    to: '0x9876...4321',
    timestamp: '1 day ago',
    status: 'completed',
    hash: '0xdef456...',
  },
  {
    id: '3',
    type: 'swap',
    amount: '100',
    symbol: 'USDC → ETH',
    timestamp: '3 days ago',
    status: 'completed',
    hash: '0xghi789...',
  },
];

const getTransactionIcon = (type: string) => {
  switch (type) {
    case 'send':
      return <ArrowUpRight className='text-destructive h-4 w-4' />;
    case 'receive':
      return <ArrowDownLeft className='h-4 w-4 text-success' />;
    case 'swap':
      return <ArrowLeftRight className='h-4 w-4 text-accent' />;
    default:
      return <ArrowUpRight className='h-4 w-4' />;
  }
};

export function TransactionHistory() {
  return (
    <div className='w-full p-4'>
      <div className='mb-3 flex items-center justify-between'>
        <h3 className='text-muted-foreground text-sm font-medium'>
          Recent Activity
        </h3>
        <button className='btn btn-ghost btn-sm text-xs'>View All</button>
      </div>

      <div className='space-y-2'>
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className='card cursor-pointer border border-base-300 bg-base-100 shadow-sm transition-all hover:shadow-md'
          >
            <div className='card-body p-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-3'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-base-200'>
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div>
                    <div className='flex items-center space-x-1'>
                      <span className='text-sm font-medium capitalize'>
                        {tx.type}
                      </span>
                      <span className='text-sm'>
                        {tx.amount} {tx.symbol}
                      </span>
                    </div>
                    <div className='text-base-content/60 text-xs'>
                      {tx.type === 'send' &&
                        tx.to &&
                        `To ${tx.to.slice(0, 6)}...${tx.to.slice(-4)}`}
                      {tx.type === 'receive' &&
                        tx.from &&
                        `From ${tx.from.slice(0, 6)}...${tx.from.slice(-4)}`}
                      {tx.type === 'swap' && 'Via Uniswap'}
                    </div>
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  <div className='text-right'>
                    <div className='text-base-content/60 text-xs'>
                      {tx.timestamp}
                    </div>
                    <div
                      className={`text-xs ${
                        tx.status === 'completed'
                          ? 'text-success'
                          : tx.status === 'pending'
                            ? 'text-warning'
                            : 'text-error'
                      }`}
                    >
                      {tx.status}
                    </div>
                  </div>
                  <button className='btn btn-ghost btn-sm h-auto p-1'>
                    <ExternalLink className='text-base-content/60 h-3 w-3' />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
