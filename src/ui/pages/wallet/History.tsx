import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';

import { Account, TxHistoryItem, TxType } from '@/shared/types';
import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useCurrentAccount } from '@/ui/state/hooks';

import { useWallet } from '../../utils/walletContext';
import { useNavigate } from '../MainRoute';

interface TransactionDisplayItem extends TxHistoryItem {
  type: 'send' | 'receive' | 'unknown';
  displayAmount: string;
  displaySymbol: string;
  timeAgo: string;
}

type TxFilter = 'all' | 'send' | 'receive';

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
  const bigIntValue = typeof value === 'string' ? BigInt(value) : value;
  const UNIT = 100000000n;
  const isNegative = bigIntValue < 0n;
  const abs = isNegative ? -bigIntValue : bigIntValue;
  const integerPart = abs / UNIT;
  const decimalPart = (abs % UNIT).toString().padStart(8, '0');

  const sign = isNegative ? '-' : '';
  return `${sign}${integerPart.toString()}.${decimalPart}`;
};

const getTransactionType = (tx: TxHistoryItem): 'send' | 'receive' | 'unknown' => {
  if (tx.txType === TxType.RECEIVE) return 'receive';
  if (tx.txType === TxType.SEND) return 'send';
  return 'unknown';
};

export default function History() {
  const PAGE_SIZE = 20;
  const navigate = useNavigate();
  const { t } = useLanguage();
  const wallet = useWallet();
  const currentAccount = useCurrentAccount();

  const [transactions, setTransactions] = useState<TransactionDisplayItem[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState<TxFilter>('all');

  // const wif = wallet.getWIF(currentAccount.address); 获取私钥
  const filterOptions: { key: TxFilter; label: string }[] = [
    { key: 'all', label: t('history.all') },
    { key: 'receive', label: t('history.receive') },
    { key: 'send', label: t('history.send') },
  ];

  const getTransactionIcon = (type: string, coinbase?: boolean) => {
    if (coinbase) {
      return (
        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/15'>
          <svg
            className='h-4 w-4 text-amber-600'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 3l2.8 5.6 6.2.9-4.5 4.4 1.1 6.2L12 17.8 6.4 20l1.1-6.2L3 9.5l6.2-.9L12 3z'
            />
          </svg>
        </div>
      );
    }

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

  const handleOpenTransactionDetail = (tx: TransactionDisplayItem) => {
    navigate('TransactionDetailScreen', { transaction: tx });
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
          setNextCursor(undefined);
          setHasMore(false);

          const result = await wallet.getAddressHistory(account, PAGE_SIZE);
          const list = Array.isArray(result?.list) ? result.list : [];
          const displayTransactions: TransactionDisplayItem[] = list.map(
            (tx: TxHistoryItem) => ({
              ...tx,
              type: getTransactionType(tx),
              displayAmount: formatAmount(tx.value.toString()),
              displaySymbol: 'ZENT',
              timeAgo: formatTimeAgo(tx.blockTime),
            })
          );
          setTransactions(displayTransactions);
          setNextCursor(result?.nextCursor);
          setHasMore(Boolean(result?.hasMore));
        } catch (error) {
          console.error('[UI] Error fetching transactions:', error);
          setTransactions([]);
          setNextCursor(undefined);
          setHasMore(false);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchTransactions(currentAccount);
  }, [currentAccount, wallet, PAGE_SIZE]);

  const handleLoadMore = async () => {
    if (!currentAccount || !hasMore || loadingMore || !nextCursor) return;

    try {
      setLoadingMore(true);
      const result = await wallet.getAddressHistory(currentAccount, PAGE_SIZE, nextCursor);
      const list = Array.isArray(result?.list) ? result.list : [];
      const displayTransactions: TransactionDisplayItem[] = list.map(
        (tx: TxHistoryItem) => ({
          ...tx,
          type: getTransactionType(tx),
          displayAmount: formatAmount(tx.value.toString()),
          displaySymbol: 'ZENT',
          timeAgo: formatTimeAgo(tx.blockTime),
        })
      );
      setTransactions((prev) => [...prev, ...displayTransactions]);
      setNextCursor(result?.nextCursor);
      setHasMore(Boolean(result?.hasMore));
    } catch (error) {
      console.error('[UI] Error loading more transactions:', error);
      toast.error(t('common.error'));
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className='flex h-screen flex-col bg-white'>
      {/* Fixed Header */}
      <div className='absolute left-0 top-0 z-10 flex h-14 w-full items-center justify-between border-b border-gray-100 bg-white px-4'>
        <button
          onClick={() => navigate('#back')}
          className='-ml-2 flex h-8 w-8 items-center justify-center rounded-full text-gray-800 transition-colors hover:bg-gray-100'
        >
          <ArrowLeft className='h-5 w-5' />
        </button>
        <h1 className='absolute left-1/2 -translate-x-1/2 transform text-lg font-semibold text-gray-900'>
          {t('history.title')}
        </h1>
        <div className='h-8 w-8' />
      </div>

      {/* 筛选器 (Filters) */}
      <div className='z-10 mt-14 bg-white px-4 py-3'>
        <div className='flex items-center space-x-2'>
          <Filter className='h-4 w-4 text-gray-400' />
          <div className='hide-scrollbar flex w-full space-x-2 overflow-x-auto'>
            {filterOptions.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`flex-shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  filter === key
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 交易列表 (Transaction List) */}
      <div className='hide-scrollbar flex-1 overflow-y-auto bg-white px-4 pb-8'>
        {filteredTransactions.length === 0 && !loading ? (
          <div className='flex h-64 flex-col items-center justify-center text-center'>
            <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50'>
              <svg
                className='h-8 w-8 text-gray-300'
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
            <h3 className='mb-2 text-lg font-semibold text-gray-900'>
              {t('history.no_transactions')}
            </h3>
            <p className='text-sm text-gray-500'>
              {filter === 'all'
                ? t('history.no_transactions_description')
                : t('history.no_filtered_transactions').replace(
                    '{type}',
                    filter === 'send' ? t('history.send') : t('history.receive')
                  )}
            </p>
          </div>
        ) : (
          <div className='flex flex-col space-y-3 pt-2'>
            {filteredTransactions.map((tx) => (
              <div
                key={`${tx.txid}:${tx.index}`}
                className='flex cursor-pointer items-center justify-between rounded-2xl bg-gray-50 px-4 py-4 transition-colors hover:bg-gray-100/80 active:bg-gray-100'
                onClick={() => handleOpenTransactionDetail(tx)}
              >
                {/* 左侧：图标和交易信息 */}
                <div className='flex min-w-0 items-center space-x-3'>
                  {getTransactionIcon(tx.type, tx.coinbase)}
                  <div className='min-w-0'>
                    <div className='flex items-center space-x-2'>
                      <span className='truncate text-base font-semibold text-gray-900'>
                        {tx.coinbase
                          ? t('history.coinbase')
                          : tx.type === 'send'
                            ? t('history.send')
                            : tx.type === 'receive'
                              ? t('history.receive')
                              : t('history.unknown')}
                      </span>
                    </div>
                    <div className='truncate text-xs font-medium text-gray-400'>
                      {tx.timeAgo}
                    </div>
                  </div>
                </div>

                {/* 右侧：金额和箭头 */}
                <div className='ml-3 flex shrink-0 items-center justify-end'>
                  <div className='flex flex-col items-end'>
                    <div
                      className={`text-base font-bold tracking-tight ${
                        tx.coinbase || tx.type === 'receive'
                          ? 'text-green-500'
                          : tx.type === 'send'
                            ? 'text-gray-900'
                            : 'text-gray-500'
                      }`}
                    >
                      {tx.coinbase || tx.type === 'receive'
                        ? '+'
                        : tx.type === 'send'
                          ? '-'
                          : ''}
                      {tx.displayAmount}
                    </div>
                    <div className='text-xs font-semibold uppercase tracking-wider text-gray-400'>
                      {tx.displaySymbol}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* 加载更多 */}
            {hasMore && (
              <div className='pb-2 pt-6 text-center'>
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className='inline-flex items-center justify-center rounded-full bg-gray-100 px-6 py-2.5 text-sm font-semibold text-gray-600 transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {loadingMore ? (
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
