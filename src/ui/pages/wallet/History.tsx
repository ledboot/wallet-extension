import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  XCircle,
} from 'lucide-react';

import { Account, TxHistoryItem, TxType } from '@/shared/types';
import { useCurrentAccount } from '@/ui/state/hooks';

import { useRootStore } from '../../state';
import { useWallet } from '../../utils/walletContext';
import { useNavigate } from '../mainRoute';

interface TransactionDisplayItem extends TxHistoryItem {
  type: 'send' | 'receive' | 'unknown';
  displayAmount: string;
  displaySymbol: string;
  timeAgo: string;
}

export default function History() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const currentAccount = useCurrentAccount();
  const { networkType } = useRootStore((state) => state.settings);

  const [transactions, setTransactions] = useState<TransactionDisplayItem[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'send' | 'receive' | 'unknown'>(
    'all'
  );
  
  // const wif = wallet.getWIF(currentAccount.address); 获取私钥
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp * 1000;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return new Date(timestamp * 1000).toLocaleDateString('zh-CN');
  };

  const formatAmount = (value: bigint | string): string => {
    // 如果是字符串（从消息传递过来的），转换为 BigInt
    const bigIntValue = typeof value === 'string' ? BigInt(value) : value;
    return (bigIntValue / 100000000n).toString();
  };

  const getTransactionType = (
    tx: TxHistoryItem
  ): 'send' | 'receive' | 'unknown' => {
    if (tx.txType === TxType.RECEIVE) return 'receive';
    if (tx.txType === TxType.SEND) return 'send';
    return 'unknown';
  };

  const getTransactionStatus = (
    tx: TxHistoryItem
  ): 'completed' | 'pending' | 'failed' => {
    if (tx.confirmations >= 6) return 'completed';
    if (tx.confirmations > 0) return 'pending';
    return 'failed';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className='h-4 w-4 text-success' />;
      case 'pending':
        return <Clock className='h-4 w-4 text-warning' />;
      case 'failed':
        return <XCircle className='h-4 w-4 text-error' />;
      default:
        return <AlertCircle className='text-muted-foreground h-4 w-4' />;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send':
        return (
          <div className='bg-red-500/10 flex h-8 w-8 items-center justify-center rounded-full'>
            <svg
              className='text-red-500 h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M7 17l9.2-9.2M17 17V7H7'
              />
            </svg>
          </div>
        );
      case 'receive':
        return (
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10'>
            <svg
              className='h-4 w-4 text-green-500'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M17 7l-9.2 9.2M7 7v10h10'
              />
            </svg>
          </div>
        );
      case 'swap':
        return (
          <div className='bg-accent/10 flex h-8 w-8 items-center justify-center rounded-full'>
            <svg
              className='h-4 w-4 text-accent'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4'
              />
            </svg>
          </div>
        );
      default:
        return (
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-muted'>
            <svg
              className='text-muted-foreground h-4 w-4'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1'
              />
            </svg>
          </div>
        );
    }
  };

  const handleViewOnExplorer = (txid: string) => {
    // 根据网络类型打开对应的区块浏览器
    const explorerUrl =
      networkType === 'mainnet'
        ? `https://blockstream.info/tx/${txid}`
        : `https://blockstream.info/testnet/tx/${txid}`;
    window.open(explorerUrl, '_blank');
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  const mockTransactions: TxHistoryItem[] = [
    {
      txid: '1234567890abcdef',
      address: 'anex1234567890',
      txType: TxType.RECEIVE,
      blockHeight: 123456,
      blockHash: '1234567890abcdef1234567890abcdef',
      blockTime: Math.floor(Date.now() / 1000) - 3600, // 1小时前
      tokenType: '0',
      value: '100000000',
      rights: ['0x0000000000000000000000000000000000000000'],
      confirmations: 10,
    },
    {
      txid: 'abcdef1234567890',
      address: 'anex0987654321',
      txType: TxType.SEND,
      blockHeight: 123450,
      blockHash: 'abcdef1234567890abcdef1234567890',
      blockTime: Math.floor(Date.now() / 1000) - 86400, // 1天前
      tokenType: '0',
      value: '50000000',
      rights: ['0x0000000000000000000000000000000000000000'],
      confirmations: 10,
    },
  ];

  useEffect(() => {
    const fetchTransactions = async (account: Account) => {
      if (account) {
        console.log('[UI] fetchTransactions start', account);
        try {
          setLoading(true);
          
          // 转换 mock 数据为 TransactionDisplayItem
          // const displayTransactions: TransactionDisplayItem[] = mockTransactions.map(
          //   (tx: TxHistoryItem) => ({
          //     ...tx,
          //     type: getTransactionType(tx),
          //     displayAmount: formatAmount(tx.value),
          //     displaySymbol: 'ZENT',
          //     timeAgo: formatTimeAgo(tx.blockTime),
          //   })
          // );
          
          // setTransactions(displayTransactions);
          
          // 真实 API 调用（暂时注释）
          const result = await wallet.getAddressHistory(account, 0, 20);
          if (result && Array.isArray(result)) {
            const displayTransactions: TransactionDisplayItem[] = result.map(
              (tx: TxHistoryItem) => ({
                ...tx,
                type: getTransactionType(tx),
                displayAmount: formatAmount(tx.value),
                displaySymbol: 'ZENT',
                timeAgo: formatTimeAgo(tx.blockTime),
              })
            );
            setTransactions(displayTransactions);
          }
        } catch (error) {
          console.error('[UI] Error fetching transactions:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTransactions(currentAccount);
  }, [currentAccount, wallet]);

  return (
    <div className='flex h-screen flex-col bg-background'>
      {/* 头部 */}
      <div className='flex items-center justify-between p-4'>
        <button
          onClick={() => navigate('#back')}
          className='btn btn-ghost btn-sm'
        >
          <ArrowLeft className='h-4 w-4' />
        </button>
        <h1 className='text-lg font-semibold'>交易记录</h1>
        <div className='h-4 w-4'/>
      </div>

      {/* 筛选器 */}
      <div className='p-4'>
        <div className='flex items-center space-x-2'>
          <Filter className='text-muted-foreground h-4 w-4' />
          <span className='text-muted-foreground text-sm'>筛选:</span>
          <div className='flex space-x-2'>
            {[
              { key: 'all', label: '全部' },
              { key: 'receive', label: '接收' },
              { key: 'send', label: '发送' },
              { key: 'unknown', label: '未知' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filter === key
                    ? 'text-primary-foreground bg-primary'
                    : 'text-muted-foreground bg-muted hover:bg-muted/80'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 交易列表 */}
      <div className='flex-1 overflow-y-auto'>
        {filteredTransactions.length === 0 && !loading ? (
          <div className='flex h-full flex-col items-center justify-center p-8 text-center'>
            <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted'>
              <svg
                className='text-muted-foreground h-8 w-8'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                />
              </svg>
            </div>
            <h3 className='mb-2 text-lg font-medium'>暂无交易记录</h3>
            <p className='text-muted-foreground text-sm'>
              {filter === 'all'
                ? '您的钱包还没有任何交易记录'
                : `没有${filter === 'send' ? '发送' : filter === 'receive' ? '接收' : '交换'}类型的交易`}
            </p>
          </div>
        ) : (
          <div>
            {filteredTransactions.map((tx) => (
              <div
                key={tx.txid}
                className='flex items-center justify-between px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer'
                onClick={() => handleViewOnExplorer(tx.txid)}
              >
                {/* 左侧：图标和交易信息 */}
                <div className='flex items-center space-x-3 flex-1 min-w-0'>
                  {getTransactionIcon(tx.type)}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center space-x-2 mb-0.5'>
                      <span className='text-sm font-medium text-foreground'>
                        {tx.type === 'send'
                          ? '发送'
                          : tx.type === 'receive'
                            ? '接收'
                            : '未知'}
                      </span>
                    </div>
                    <div className='text-xs text-muted-foreground truncate'>
                      {tx.timeAgo}
                    </div>
                  </div>
                </div>

                {/* 右侧：金额和箭头 */}
                <div className='flex items-center space-x-2 ml-3'>
                  <div className='text-right'>
                    <div className={`text-sm font-semibold ${
                      tx.type === 'receive' 
                        ? 'text-success' 
                        : tx.type === 'send'
                          ? 'text-foreground'
                          : 'text-muted-foreground'
                    }`}>
                      {tx.type === 'receive' ? '+' : tx.type === 'send' ? '-' : ''}
                      {tx.displayAmount}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {tx.displaySymbol}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* 加载更多 */}
            {hasMore && (
              <div className='py-4 text-center'>
                <button
                  disabled={loading}
                  className='btn btn-outline btn-sm'
                >
                  {loading ? (
                    <>
                      <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                      加载中...
                    </>
                  ) : (
                    '加载更多'
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
