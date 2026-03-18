import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from '@/ui/pages/MainRoute';
import { ChevronLeft, X } from 'lucide-react';
import { useLocation } from 'react-router';

import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useCurrentAccount } from '@/ui/state/hooks';
import { formatAmount } from '@/ui/utils';
import { useWallet } from '@/ui/utils/walletContext';

interface LocationState {
  token: any;
  recipientAddress: string;
}

export default function AmountInputScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { token, recipientAddress } = (location.state || {}) as LocationState;
  const wallet = useWallet();
  const currentAccount = useCurrentAccount();
  const [amount, setAmount] = useState('');
  const [isMax, setIsMax] = useState(false);
  const [fee, setFee] = useState('0.00'); // Mock fee
  const [isLoadingFee, setIsLoadingFee] = useState(false);
  const [feeError, setFeeError] = useState<string | null>(null);

  // Fetch transaction fee when amount changes
  useEffect(() => {
    const fetchFee = async () => {
      // Skip if no amount or amount is zero
      if (!amount || parseFloat(amount) <= 0) {
        setFee('0');
        return;
      }
      if (isMax) return;

      if (!currentAccount?.address) return;

      setIsLoadingFee(true);
      setFeeError(null);
      try {
        const tokenType = parseInt(token.tokenType, 10) || 0;
        const feeSats = await wallet.getTransferFees(
          tokenType,
          currentAccount.address,
          false,
          amount,
          recipientAddress
        );
        setFee((feeSats / 1e8).toFixed(8)); // Keep 8 decimal places
      } catch (error) {
        console.error('获取交易费失败:', error);
        setFeeError(t('transfer.fee_fetch_failed'));
        setFee('0.0001'); // Fallback to default fee
      } finally {
        setIsLoadingFee(false);
      }
    };

    // Add debounce to prevent too many API calls
    const timer = setTimeout(() => {
      fetchFee();
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [
    amount,
    currentAccount?.address,
    token.tokenType,
    wallet,
    isMax,
    recipientAddress,
    t,
  ]);

  // Calculate total amount including fee
  const totalAmount = useMemo(() => {
    if (!amount) return '0';
    const amountNum = parseFloat(amount) || 0;
    const feeNum = parseFloat(fee) || 0;
    return (amountNum + feeNum).toString();
  }, [amount, fee]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow only numbers and a single decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setIsMax(false);
    }
  };

  const handleMax = async () => {
    if (!token || !currentAccount?.address) return;

    try {
      setIsLoadingFee(true);
      setFeeError(null);

      const tokenType = parseInt(token.tokenType, 10) || 0;
      const feeSats = await wallet.getTransferFees(
        tokenType,
        currentAccount.address,
        true
      );
      setFee((feeSats / 1e8).toFixed(8));
      // 计算扣除手续费后的余额
      const balance = parseFloat(formatAmount(token.value)) - feeSats / 1e8;
      // 设置金额为扣除手续费后的余额，确保不小于0
      setAmount(Math.max(0, balance).toString());
      setIsMax(true);
    } catch (error) {
      console.error('获取最大可转金额失败:', error);
      setFeeError(t('transfer.max_amount_failed'));
    } finally {
      setIsLoadingFee(false);
    }
  };

  const handleContinue = () => {
    if (!isValid) return;

    navigate('TransactionConfirmScreen', {
      token,
      recipientAddress,
      amount,
      fee,
      totalAmount,
    });
  };

  const isValid = useMemo(() => {
    if (!amount || parseFloat(amount) <= 0) return false;
    if (parseFloat(amount) > parseFloat(token?.value || '0')) return false;
    return true;
  }, [amount, token]);

  if (!token || !recipientAddress) {
    navigate('TokenSelectionScreen');
    return null;
  }

  return (
    <div className='flex h-full w-full flex-col bg-white'>
      <div className='absolute left-0 top-0 z-10 flex h-14 w-full items-center justify-between border-b border-gray-100 bg-white px-4'>
        <button
          onClick={() => navigate('#back')}
          className='-ml-2 flex items-center justify-center rounded-full p-2 transition-colors hover:bg-gray-100'
        >
          <ChevronLeft className='h-5 w-5 text-gray-800' />
        </button>
        <h1 className='absolute left-1/2 -translate-x-1/2 transform text-lg font-semibold text-gray-900'>
          {t('transfer.send_token').replace('{token}', token.name)}
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
          <div className='relative'>
            <div className='mb-2 flex items-center justify-between'>
              <span className='text-sm font-semibold text-gray-900'>
                {t('transfer.amount')}
              </span>
              <div className='text-sm font-medium text-gray-500'>
                {t('transfer.available')
                  .replace('{balance}', formatAmount(token.value))
                  .replace('{token}', token.name)}
              </div>
            </div>

            <div className='relative'>
              <input
                type='text'
                value={amount}
                onChange={handleAmountChange}
                placeholder='0.0'
                inputMode='decimal'
                className='w-full rounded-2xl bg-gray-50 p-6 pr-24 text-3xl font-medium text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary'
              />
              <button
                onClick={handleMax}
                className='absolute right-4 top-1/2 -translate-y-1/2 transform rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800'
              >
                {t('transfer.max')}
              </button>
            </div>
          </div>

          <div className='mt-6 rounded-2xl bg-gray-50 p-5'>
            <div className='flex justify-between py-2'>
              <span className='text-sm font-medium text-gray-500'>
                {t('transfer.network_fee')}
              </span>
              <div className='text-right text-sm font-semibold text-gray-900'>
                {isLoadingFee ? (
                  <span className='animate-pulse'>
                    {t('transfer.calculating')}
                  </span>
                ) : feeError ? (
                  <span className='text-red-500'>{feeError}</span>
                ) : (
                  <div>
                    ≈ {fee} {token.name}
                  </div>
                )}
              </div>
            </div>
            <div className='my-3 h-px bg-gray-200'></div>
            <div className='flex justify-between py-2'>
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
      </div>

      <div className='bg-white px-4 py-6'>
        <button
          onClick={handleContinue}
          disabled={!isValid}
          className={`w-full rounded-full py-3.5 font-medium transition-colors ${
            isValid
              ? 'bg-gray-900 text-white hover:bg-gray-800'
              : 'cursor-not-allowed bg-gray-100 text-gray-400'
          }`}
        >
          {t('transfer.continue')}
        </button>
      </div>
    </div>
  );
}
