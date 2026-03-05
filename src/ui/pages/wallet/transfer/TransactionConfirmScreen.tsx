import { useEffect, useState } from 'react';
import type { transferAddressHistory } from '@/shared/types';
import keyringService from '@background/service/keyring';
import { AlertCircle, Check, ChevronLeft, Copy, X } from 'lucide-react';
import { useLocation } from 'react-router';
import { toast } from 'sonner';

import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useNavigate } from '@/ui/pages/mainRoute';
import { useCurrentAccount } from '@/ui/state/hooks';
import { formatAmount } from '@/ui/utils';
import { useWallet } from '@/ui/utils/walletContext';

interface LocationState {
  token: any;
  recipientAddress: string;
  amount: string;
  fee: string;
  totalAmount: string;
}

export default function TransactionConfirmScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { token, recipientAddress, amount, fee, totalAmount } =
    (location.state || {}) as LocationState;

  const [password, setPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const currentAccount = useCurrentAccount();
  const wallet = useWallet();

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success(t('transfer.copied'));
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleConfirm = () => {
    setShowPasswordDialog(true);
  };

  const handleSend = async () => {
    if (!password) return;
    try {
      await wallet.verifyPassword(password);
    } catch (error) {
      // console.error('Password verification failed:', error);
      toast.error(t('transfer.password_error'));
      setPassword('');
      return;
    }
    setIsSending(true);
    try {
      // TODO: Replace with actual send transaction logic
      console.log('Sending transaction:', {
        from: currentAccount?.address,
        to: recipientAddress,
        amount,
        token: token.name,
        fee,
      });

      // Make the transfer
      const result = await wallet.transfer(
        amount,
        token.tokenType,
        recipientAddress,
        password,
        currentAccount.address,
        0,
        15
      );
      console.log('Transfer result:', result);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await wallet.updateTransferAddressesHistory(recipientAddress);

      if (result) {
        toast.success(t('transfer.transaction_sent'));
      } else {
        toast.error(t('transfer.transaction_failed'));
      }
      navigate('MainScreen');
    } catch (error) {
      console.error('Transaction failed:', error);
      // toast.error('交易失败: ' + (error as Error).message);
    } finally {
      setIsSending(false);
      setShowPasswordDialog(false);
      setPassword('');
    }
  };

  if (!token || !recipientAddress || !amount) {
    navigate('TokenSelectionScreen');
    return null;
  }

  return (
    <div className='flex h-full w-full flex-col bg-white'>
      <div className='absolute left-0 top-0 z-10 flex h-14 w-full items-center justify-between bg-white px-4'>
        <button
          onClick={() => navigate('#back')}
          className='-ml-2 flex items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-100'
        >
          <ChevronLeft className='h-5 w-5 text-gray-800' />
        </button>
        <h1 className='absolute left-1/2 -translate-x-1/2 transform text-lg font-semibold text-gray-900'>
          {t('transfer.confirm_transaction')}
        </h1>
        <button
          onClick={() => navigate('MainScreen')}
          className='-mr-2 flex items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-100'
        >
          <X className='h-5 w-5 text-gray-800' />
        </button>
      </div>

      <div className='hide-scrollbar flex-1 overflow-y-auto bg-white px-4 pb-6 pt-20'>
        <div className='mb-6'>
          <div className='mb-8 text-center'>
            <div className='text-4xl font-bold text-gray-900'>{amount}</div>
            <div className='mt-1 text-sm font-medium text-gray-500'>
              {token.name}
            </div>
          </div>

          <div className='space-y-4 rounded-2xl bg-gray-50 p-5'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-gray-500'>
                {t('transfer.network')}
              </span>
              <span className='text-sm font-semibold text-gray-900'>
                {token.chainLabel}
              </span>
            </div>

            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium text-gray-500'>
                {t('transfer.token_label')}
              </span>
              <div className='flex items-center'>
                <img
                  src={token.iconHtml}
                  alt={token.name}
                  className='mr-2 h-5 w-5 rounded-full'
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/20';
                  }}
                />
                <span className='text-sm font-semibold text-gray-900'>
                  {token.name}
                </span>
              </div>
            </div>

            <div className='my-2 h-px bg-gray-200'></div>

            <div className='space-y-4'>
              <div className='flex justify-between'>
                <span className='text-sm font-medium text-gray-500'>
                  {t('transfer.send_from')}
                </span>
                <div className='flex items-center text-sm font-semibold text-gray-900'>
                  <span className='font-mono'>
                    {currentAccount?.address?.slice(0, 6)}...
                    {currentAccount?.address?.slice(-4)}
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(currentAccount?.address || '', 'from')
                    }
                    className='ml-2 text-gray-400 hover:text-gray-600'
                  >
                    {copiedField === 'from' ? (
                      <Check className='h-4 w-4' />
                    ) : (
                      <Copy className='h-4 w-4' />
                    )}
                  </button>
                </div>
              </div>

              <div className='flex justify-between'>
                <span className='text-sm font-medium text-gray-500'>
                  {t('transfer.send_to')}
                </span>
                <div className='flex items-center text-sm font-semibold text-gray-900'>
                  <span className='font-mono'>
                    {recipientAddress.slice(0, 6)}...
                    {recipientAddress.slice(-4)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(recipientAddress, 'to')}
                    className='ml-2 text-gray-400 hover:text-gray-600'
                  >
                    {copiedField === 'to' ? (
                      <Check className='h-4 w-4' />
                    ) : (
                      <Copy className='h-4 w-4' />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className='my-2 h-px bg-gray-200'></div>

            <div className='space-y-4'>
              <div className='flex justify-between'>
                <span className='text-sm font-medium text-gray-500'>
                  {t('transfer.network_fee')}
                </span>
                <div className='text-right text-sm font-semibold text-gray-900'>
                  <div>
                    {fee} {token.name}
                  </div>
                </div>
              </div>

              <div className='flex justify-between'>
                <span className='text-sm font-medium text-gray-500'>
                  {t('transfer.total')}
                </span>
                <div className='text-right text-sm font-semibold text-gray-900'>
                  <div>
                    {totalAmount} {token.name}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='mt-6 flex items-start rounded-2xl bg-orange-50 p-4'>
            <AlertCircle className='mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-orange-500' />
            <p className='text-sm leading-relaxed text-orange-700'>
              {t('transfer.warning_message')}
            </p>
          </div>
        </div>
      </div>

      <div className='bg-white px-4 py-6'>
        <button
          onClick={handleConfirm}
          disabled={isSending}
          className={`w-full rounded-full py-3.5 font-medium transition-colors ${
            isSending
              ? 'cursor-wait bg-gray-100 text-gray-400'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {isSending ? t('transfer.processing') : t('transfer.confirm_send')}
        </button>
      </div>

      {/* Password Dialog (DaisyUI styled) */}
      <dialog className={`modal ${showPasswordDialog ? 'modal-open' : ''}`}>
        <div className='modal-box bg-white'>
          <h3 className='text-lg font-bold text-gray-900'>
            {t('transfer.enter_password')}
          </h3>
          <p className='py-4 text-sm text-gray-500'>
            {t('transfer.password_description')}
          </p>

          <input
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('transfer.wallet_password')}
            className='w-full rounded-xl bg-gray-50 p-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300'
            autoFocus
          />

          <div className='modal-action mt-6 gap-3'>
            <button
              className='btn btn-ghost flex-1 rounded-full font-medium text-gray-600 hover:bg-gray-100'
              onClick={() => setShowPasswordDialog(false)}
              disabled={isSending}
            >
              {t('transfer.cancel')}
            </button>
            <button
              className={`btn flex-1 rounded-full border-none font-medium text-white transition-colors ${
                !password || isSending
                  ? 'bg-gray-300 hover:bg-gray-300'
                  : 'bg-gray-900 hover:bg-gray-800'
              }`}
              onClick={handleSend}
              disabled={!password || isSending}
            >
              {isSending ? (
                <>
                  <span className='loading loading-spinner loading-sm'></span>
                  {t('transfer.sending')}
                </>
              ) : (
                t('transfer.confirm')
              )}
            </button>
          </div>
        </div>
        <form method='dialog' className='modal-backdrop bg-black/40'>
          <button onClick={() => setShowPasswordDialog(false)}>close</button>
        </form>
      </dialog>
    </div>
  );
}
