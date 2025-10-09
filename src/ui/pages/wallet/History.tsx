import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, RefreshCw, Filter, ExternalLink, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from '../mainRoute';
import { useWallet } from '../../utils/walletContext';
import { useRootStore } from '../../state';
import { TxHistoryItem } from '@/shared/types';
import { toast } from 'sonner';
import { useCurrentAccount, useCurrentKeyring } from '@/ui/state/hooks';

interface TransactionDisplayItem extends TxHistoryItem {
  type: 'send' | 'receive' | 'swap';
  displayAmount: string;
  displaySymbol: string;
  status: 'completed' | 'pending' | 'failed';
  timeAgo: string;
}

export default function History() {
  const navigate = useNavigate();
  const wallet = useWallet();
  const currentKeyring = useCurrentKeyring();
  const currentAccount = useCurrentAccount();
  const { current } = useRootStore((state) => state.accounts);
  const { networkType } = useRootStore((state) => state.settings);
  
  const [transactions, setTransactions] = useState<TransactionDisplayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'send' | 'receive' | 'swap'>('all');
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

  const formatAmount = (value: number): string => {
    return (value / 100000000).toFixed(8);
  };

  const getTransactionType = (tx: TxHistoryItem): 'send' | 'receive' | 'swap' => {
    const currentAddress = current.address;
    const isInput = tx.vin.some(input => input.address === currentAddress);
    const isOutput = tx.vout.some(output => output.address === currentAddress);
    
    if (isInput && isOutput) return 'swap';
    if (isInput) return 'send';
    return 'receive';
  };

  const calculateTransactionAmount = (tx: TxHistoryItem): { amount: number; isIncoming: boolean } => {
    const currentAddress = current.address;
    const inputValue = tx.vin
      .filter(input => input.address === currentAddress)
      .reduce((sum, input) => sum + input.value, 0);
    const outputValue = tx.vout
      .filter(output => output.address === currentAddress)
      .reduce((sum, output) => sum + output.value, 0);
    
    const netAmount = outputValue - inputValue;
    return {
      amount: Math.abs(netAmount),
      isIncoming: netAmount > 0
    };
  };

  const getTransactionStatus = (tx: TxHistoryItem): 'completed' | 'pending' | 'failed' => {
    if (tx.confirmations >= 6) return 'completed';
    if (tx.confirmations > 0) return 'pending';
    return 'failed';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-success" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-error" />;
      default:
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'send':
        return <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
          <svg className="h-4 w-4 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
          </svg>
        </div>;
      case 'receive':
        return <div className="h-8 w-8 rounded-full bg-success/10 flex items-center justify-center">
          <svg className="h-4 w-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
          </svg>
        </div>;
      case 'swap':
        return <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center">
          <svg className="h-4 w-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>;
      default:
        return <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
          <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>;
    }
  };

  const loadTransactions = useCallback(async (reset = false) => {
    if (!current.address) return;
    
    try {
      setLoading(true);
      const start = reset ? 0 : page * 20;
      const limit = 20;

      console.log('currentKeyring', currentKeyring);
      
      const result = await wallet.getAddressHistory({
        account: current,
        start,
        limit
      });
      
      if (result && Array.isArray(result)) {
        const newTransactions: TransactionDisplayItem[] = result.map((tx: TxHistoryItem) => {
          const { amount } = calculateTransactionAmount(tx);
          return {
            ...tx,
            type: getTransactionType(tx),
            displayAmount: formatAmount(amount),
            displaySymbol: 'BTC',
            status: getTransactionStatus(tx),
            timeAgo: formatTimeAgo(tx.timestamp)
          };
        });
        
        if (reset) {
          setTransactions(newTransactions);
          setPage(1);
        } else {
          setTransactions(prev => [...prev, ...newTransactions]);
          setPage(prev => prev + 1);
        }
        
        setHasMore(result.length === limit);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      toast.error('加载交易记录失败');
    } finally {
      setLoading(false);
    }
  }, [current.address, page, wallet]);

  const handleRefresh = () => {
    setPage(0);
    loadTransactions(true);
  };

  const handleViewOnExplorer = (txid: string) => {
    // 根据网络类型打开对应的区块浏览器
    const explorerUrl = networkType === 'mainnet' 
      ? `https://blockstream.info/tx/${txid}`
      : `https://blockstream.info/testnet/tx/${txid}`;
    window.open(explorerUrl, '_blank');
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    return tx.type === filter;
  });

  useEffect(() => {
    console.log('current', currentKeyring,currentAccount);
    if (current.address) {
      loadTransactions(true);
    }
  }, [current.address,currentKeyring,currentAccount]);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <button
          onClick={() => navigate('#back')}
          className="btn btn-ghost btn-sm"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h1 className="text-lg font-semibold">交易记录</h1>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="btn btn-ghost btn-sm"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 筛选器 */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">筛选:</span>
          <div className="flex space-x-2">
            {[
              { key: 'all', label: '全部' },
              { key: 'receive', label: '接收' },
              { key: 'send', label: '发送' },
              { key: 'swap', label: '交换' }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filter === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 交易列表 */}
      <div className="flex-1 overflow-y-auto">
        {filteredTransactions.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2">暂无交易记录</h3>
            <p className="text-muted-foreground text-sm">
              {filter === 'all' ? '您的钱包还没有任何交易记录' : `没有${filter === 'send' ? '发送' : filter === 'receive' ? '接收' : '交换'}类型的交易`}
            </p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {filteredTransactions.map((tx) => (
              <div
                key={tx.txid}
                className="card border border-border bg-card shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleViewOnExplorer(tx.txid)}
              >
                <div className="card-body p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getTransactionIcon(tx.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium capitalize">
                            {tx.type === 'send' ? '发送' : tx.type === 'receive' ? '接收' : '交换'}
                          </span>
                          <span className="text-sm font-mono">
                            {tx.displayAmount} {tx.displaySymbol}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {tx.confirmations >= 6 ? '已确认' : `${tx.confirmations} 确认中`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {tx.timeAgo}
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          {getStatusIcon(tx.status)}
                          <span className={`text-xs ${
                            tx.status === 'completed' ? 'text-success' :
                            tx.status === 'pending' ? 'text-warning' : 'text-error'
                          }`}>
                            {tx.status === 'completed' ? '已完成' :
                             tx.status === 'pending' ? '处理中' : '失败'}
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* 加载更多 */}
            {hasMore && (
              <div className="text-center py-4">
                <button
                  onClick={() => loadTransactions()}
                  disabled={loading}
                  className="btn btn-outline btn-sm"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
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