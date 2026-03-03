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
import { useLanguage } from '@/ui/contexts/LanguageContext';
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
  const { t } = useLanguage();
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
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // const wif = wallet.getWIF(currentAccount.address); 获取私钥
  const filterOptions = [
    { key: 'all', label: t('history.all') },
    { key: 'receive', label: t('history.receive') },
    { key: 'send', label: t('history.send') },
    { key: 'unknown', label: t('history.unknown') },
  ];

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
          <div className='flex h-8 w-8 items-center justify-center rounded-full bg-red-500/10'>
            <svg
              className='h-4 w-4 text-red-500'
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
                displayAmount: formatAmount(tx.value.toString()),
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
        <h1 className='text-lg font-semibold'>{t('history.title')}</h1>
        <div className='h-4 w-4' />
      </div>

      {/* 筛选器 */}
      <div className='p-4'>
        <div className='flex items-center space-x-2'>
          <Filter className='text-muted-foreground h-4 w-4' />
          <span className='text-muted-foreground text-sm'>
            {t('history.filter')}
          </span>
          <div className='flex space-x-2'>
            {filterOptions.map(({ key, label }) => (
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
            <h3 className='mb-2 text-lg font-medium'>
              {t('history.no_transactions')}
            </h3>
            <p className='text-muted-foreground text-sm'>
              {filter === 'all'
                ? t('history.no_transactions_description')
                : t('history.no_filtered_transactions').replace(
                    '{type}',
                    filter === 'send'
                      ? t('history.send')
                      : filter === 'receive'
                        ? t('history.receive')
                        : t('history.unknown')
                  )}
            </p>
          </div>
        ) : (
          <div>
            {filteredTransactions.map((tx) => (
              <div
                key={tx.txid}
                className='flex cursor-pointer items-center justify-between px-4 py-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800'
                onClick={() => handleViewOnExplorer(tx.txid)}
              >
                {/* 左侧：图标和交易信息 */}
                <div className='flex min-w-0 flex-1 items-center space-x-3'>
                  {getTransactionIcon(tx.type)}
                  <div className='min-w-0 flex-1'>
                    <div className='mb-0.5 flex items-center space-x-2'>
                      <span className='text-sm font-medium text-foreground'>
                        {tx.type === 'send'
                          ? t('history.send')
                          : tx.type === 'receive'
                            ? t('history.receive')
                            : t('history.unknown')}
                      </span>
                    </div>
                    <div className='text-muted-foreground truncate text-xs'>
                      {tx.timeAgo}
                    </div>
                  </div>
                </div>

                {/* 右侧：金额和箭头 */}
                <div className='ml-3 flex items-center space-x-2'>
                  <div className='text-right'>
                    <div
                      className={`text-sm font-semibold ${
                        tx.type === 'receive'
                          ? 'text-success'
                          : tx.type === 'send'
                            ? 'text-foreground'
                            : 'text-muted-foreground'
                      }`}
                    >
                      {tx.type === 'receive'
                        ? '+'
                        : tx.type === 'send'
                          ? '-'
                          : ''}
                      {tx.displayAmount}
                    </div>
                    <div className='text-muted-foreground text-xs'>
                      {tx.displaySymbol}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* 加载更多 */}
            {hasMore && (
              <div className='py-4 text-center'>
                <button disabled={loading} className='btn btn-outline btn-sm'>
                  {loading ? (
                    <>
                      <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                      {t('history.loading_more')}
                    </>
                  ) : (
                    t('history.load_more')
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
