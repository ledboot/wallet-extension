import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocation } from 'react-router';
import { useNavigate } from '@/ui/pages/mainRoute';
import { useState, useEffect, useMemo } from 'react';
import { formatAmount } from '@/ui/utils';
import { useWallet } from '@/ui/utils/walletContext';
import { useCurrentAccount } from '@/ui/state/hooks';
import { useLanguage } from '@/ui/contexts/LanguageContext';
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
      if(isMax) return
      
      if (!currentAccount?.address) return;
      
      setIsLoadingFee(true);
      setFeeError(null);
      try {
        const tokenType = parseInt(token.tokenType, 10) || 0;
        const feeSats = await wallet.getTransferFees(tokenType, currentAccount.address, false, amount, recipientAddress);
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
  }, [amount, currentAccount?.address, token.tokenType, wallet, isMax, recipientAddress]);

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
      const feeSats = await wallet.getTransferFees(tokenType, currentAccount.address, true);
      setFee((feeSats/ 1e8).toFixed(8));
      // 计算扣除手续费后的余额
      const balance = parseFloat(formatAmount(token.value)) - (feeSats/ 1e8);
      // 设置金额为扣除手续费后的余额，确保不小于0
      setAmount(Math.max(0, balance).toString());
      setIsMax(true);

    }catch (error) {
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
    <div className="h-screen flex flex-col">
      <div className='w-full sticky top-0 z-20 flex h-14 items-center justify-between px-4 py-[15px] bg-wallet-bg'>
        <button 
          onClick={() => navigate('#back')} 
          className='flex items-center space-x-1 text-sm font-medium'
        >
          <ChevronLeft className='h-5 w-5' />
          <span>{t('transfer.back')}</span>
        </button>
        <h1 className='text-lg font-semibold'>{t('transfer.send_token').replace('{token}', token.name)}</h1>
        <div className='w-10' />
      </div>

      <div className="flex-1 overflow-y-auto bg-wallet-bg px-4 py-6">
        <div className="mb-6">
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-400">{t('transfer.amount')}</span>
              <div className="text-sm text-gray-400">
                {t('transfer.available').replace('{balance}', formatAmount(token.value)).replace('{token}', token.name)}
              </div>
            </div>
            
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.0"
                inputMode="decimal"
                className="w-full p-4 pr-24 bg-wallet-card border border-border rounded-xl text-3xl font-medium placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                onClick={handleMax}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-primary/10 text-primary text-sm font-medium px-3 py-1 rounded-md hover:bg-primary/20 transition-colors"
              >
                {t('transfer.max')}
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-2 px-1">
            </div>
          </div>

          <div className="mt-6 bg-wallet-card rounded-xl p-4 border border-border">
            <div className="flex justify-between py-2">
              <span className="text-gray-400">{t('transfer.network_fee')}</span>
              <div className="text-right">
                {isLoadingFee ? (
                  <span className="animate-pulse">{t('transfer.calculating')}</span>
                ) : feeError ? (
                  <span className="text-red-500">{feeError}</span>
                ) : (
                  <div>≈ {fee} {token.name}</div>
                )}
              </div>
            </div>
            <div className="h-px bg-border my-2"></div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">{t('transfer.total')}</span>
              <div className="text-right">
                <div>{totalAmount} {token.name}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 border-border bg-wallet-bg">
        <button
          onClick={handleContinue}
          disabled={!isValid}
          className={`w-full py-3 rounded-xl font-medium ${
            isValid 
              ? 'bg-primary text-white hover:bg-primary/90' 
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          {t('transfer.continue')}
        </button>
      </div>
    </div>
  );
}
