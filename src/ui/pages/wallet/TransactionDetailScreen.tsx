import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Copy, ExternalLink } from 'lucide-react';
import { useLocation } from 'react-router';
import { toast } from 'sonner';

import { TxHistoryItem } from '@/shared/types';
import { capturePostHogEvent } from '@/shared/telemetry/posthog';
import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useWallet } from '@/ui/utils/walletContext';

interface TransactionDisplayItem extends TxHistoryItem {
  type: 'send' | 'receive' | 'unknown';
  displayAmount: string;
  displaySymbol: string;
  timeAgo: string;
}

interface LocationState {
  transaction?: TransactionDisplayItem;
}

const formatDateTime = (timestamp: number): string => {
  if (!timestamp) return '-';
  return new Date(timestamp * 1000).toLocaleString();
};

export default function TransactionDetailScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const wallet = useWallet();
  const { t } = useLanguage();

  const { transaction } = (location.state || {}) as LocationState;
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!transaction) {
      navigate('#back');
    }
  }, [navigate, transaction]);

  if (!transaction) {
    return null;
  }

  const txTypeLabel = transaction.coinbase
    ? t('history.coinbase')
    : transaction.type === 'send'
      ? t('history.send')
      : transaction.type === 'receive'
        ? t('history.receive')
        : t('history.unknown');

  const fromAddress = transaction.coinbase
    ? t('history.coinbase')
    : transaction.type === 'send'
      ? transaction.myaddress || '-'
      : transaction.address || '-';

  const toAddress = transaction.coinbase
    ? transaction.myaddress || '-'
    : transaction.type === 'send'
      ? transaction.address || '-'
      : transaction.myaddress || '-';

  const statusLabel = transaction.confirmations > 0 ? t('history.confirmed') : t('history.pending');

  const handleCopy = async (text: string, field: string) => {
    if (!text || text === '-') return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success(t('transfer.copied'));
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('[UI] Failed to copy text:', error);
      toast.error(t('common.error'));
    }
  };

  const handleViewOnExplorer = async () => {
    capturePostHogEvent('history_view_on_explorer_clicked');

    try {
      const currentChainInfo = await wallet.getCurrentChainInfoData();
      const baseExplorerUrl = currentChainInfo?.explorerUrl?.trim() || '';
      if (!baseExplorerUrl) {
        capturePostHogEvent('history_view_on_explorer_skipped', {
          reason: 'empty_explorer_url',
        });
        return;
      }

      const finalUrl = baseExplorerUrl.includes('{txid}')
        ? baseExplorerUrl.replaceAll('{txid}', transaction.txid)
        : `${baseExplorerUrl.replace(/\/+$/, '')}/tx/${transaction.txid}`;
      window.open(finalUrl, '_blank');
      capturePostHogEvent('history_view_on_explorer_opened');
    } catch (error) {
      console.error('[UI] Failed to open explorer:', error);
      toast.error(t('common.error'));
      capturePostHogEvent('history_view_on_explorer_failed');
    }
  };

  return (
    <div className='flex h-screen flex-col bg-white'>
      <div className='absolute left-0 top-0 z-10 flex h-14 w-full items-center justify-between border-b border-gray-100 bg-white px-4'>
        <button
          onClick={() => navigate('#back')}
          className='-ml-2 flex h-8 w-8 items-center justify-center rounded-full text-gray-800 transition-colors hover:bg-gray-100'
        >
          <ArrowLeft className='h-5 w-5' />
        </button>
        <h1 className='absolute left-1/2 -translate-x-1/2 transform text-lg font-semibold text-gray-900'>
          {t('history.detail_title')}
        </h1>
        <div className='h-8 w-8' />
      </div>

      <div className='hide-scrollbar flex-1 overflow-y-auto bg-white px-4 pb-6 pt-20'>
        <div className='mb-4 rounded-2xl bg-gray-50 p-5'>
          <div className='mb-1 text-sm font-medium text-gray-500'>{txTypeLabel}</div>
          <div className='text-2xl font-bold text-gray-900'>
            {transaction.coinbase || transaction.type === 'receive' ? '+' : transaction.type === 'send' ? '-' : ''}
            {transaction.displayAmount}
          </div>
          <div className='mt-1 text-sm font-semibold uppercase tracking-wide text-gray-500'>
            {transaction.displaySymbol}
          </div>
          <div className='mt-4 inline-flex items-center rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-700'>
            {t('history.status')}: {statusLabel}
          </div>
        </div>

        <div className='space-y-4 rounded-2xl bg-white pb-4'>
          <div className='flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3'>
            <span className='text-sm font-medium text-gray-500'>{t('history.block_time')}</span>
            <span className='text-sm font-semibold text-gray-900'>{formatDateTime(transaction.blockTime)}</span>
          </div>

          <div className='flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3'>
            <span className='text-sm font-medium text-gray-500'>{t('history.block_height')}</span>
            <span className='text-sm font-semibold text-gray-900'>{transaction.blockHeight || '-'}</span>
          </div>

          <div className='flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3'>
            <span className='text-sm font-medium text-gray-500'>{t('history.confirmations')}</span>
            <span className='text-sm font-semibold text-gray-900'>{transaction.confirmations}</span>
          </div>

          <div className='rounded-xl bg-gray-50 px-4 py-3'>
            <div className='mb-2 text-sm font-medium text-gray-500'>{t('history.transaction_id')}</div>
            <div className='flex items-start justify-between gap-2'>
              <span className='break-all font-mono text-xs text-gray-900'>{transaction.txid}</span>
              <button
                onClick={() => handleCopy(transaction.txid, 'txid')}
                className='rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700'
              >
                {copiedField === 'txid' ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
              </button>
            </div>
          </div>

          <div className='rounded-xl bg-gray-50 px-4 py-3'>
            <div className='mb-2 text-sm font-medium text-gray-500'>{t('history.from_address')}</div>
            <div className='flex items-start justify-between gap-2'>
              <span className='break-all font-mono text-xs text-gray-900'>{fromAddress}</span>
              {fromAddress !== '-' && fromAddress !== t('history.coinbase') && (
                <button
                  onClick={() => handleCopy(fromAddress, 'from')}
                  className='rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700'
                >
                  {copiedField === 'from' ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
                </button>
              )}
            </div>
          </div>

          <div className='rounded-xl bg-gray-50 px-4 py-3'>
            <div className='mb-2 text-sm font-medium text-gray-500'>{t('history.to_address')}</div>
            <div className='flex items-start justify-between gap-2'>
              <span className='break-all font-mono text-xs text-gray-900'>{toAddress}</span>
              {toAddress !== '-' && (
                <button
                  onClick={() => handleCopy(toAddress, 'to')}
                  className='rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700'
                >
                  {copiedField === 'to' ? <Check className='h-4 w-4' /> : <Copy className='h-4 w-4' />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className='bg-white px-4 py-6'>
        <button
          onClick={handleViewOnExplorer}
          className='flex w-full items-center justify-center rounded-full bg-gray-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800'
        >
          <ExternalLink className='mr-2 h-4 w-4' />
          {t('history.view_on_explorer')}
        </button>
      </div>
    </div>
  );
}
