import { ChevronLeft, Copy, Check, AlertCircle } from 'lucide-react';
import { useLocation } from 'react-router';
import { useNavigate } from '@/ui/pages/mainRoute';
import { useState, useEffect } from 'react';
import { formatAmount } from '@/ui/utils';
import { toast } from 'sonner';
import { useCurrentAccount } from '@/ui/state/hooks';
import keyringService from '@background/service/keyring';
import type { transferAddressHistory } from '@/shared/types';
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
  const { 
    token, 
    recipientAddress, 
    amount, 
    fee, 
    totalAmount,
  } = (location.state || {}) as LocationState;
  
  const [password, setPassword] = useState('');
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const currentAccount = useCurrentAccount();
  const wallet = useWallet();

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success('已复制');
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
      toast.error('密码错误，请重试');
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
      const result = await wallet.transfer(amount, token.tokenType, recipientAddress, password, currentAccount.address, 0, 15);
      console.log('Transfer result:', result);
      await new Promise(resolve => setTimeout(resolve, 1500));
      await wallet.updateTransferAddressesHistory(recipientAddress);
      
      if (result) {
        toast.success('交易已发送');
      } else {
        toast.error('交易发送失败');
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
    <div className="h-screen flex flex-col">
      <div className='w-full sticky top-0 z-20 flex h-14 items-center justify-between px-4 py-[15px] bg-wallet-bg'>
        <button 
          onClick={() => navigate('#back')} 
          className='flex items-center space-x-1 text-sm font-medium'
        >
          <ChevronLeft className='h-5 w-5' />
          <span>返回</span>
        </button>
        <h1 className='text-lg font-semibold'>确认交易</h1>
        <div className='w-10' />
      </div>

      <div className="flex-1 overflow-y-auto bg-wallet-bg px-4 py-6">
        <div className="bg-wallet-card rounded-xl p-4 border border-border mb-6">
          <div className="text-2xl font-bold text-center mb-2">
            {amount}
          </div>
          <div className="text-center text-gray-400 text-sm mb-6">
             {token.name}
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">网络</span>
              <span>{token.chainLabel}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-400">代币</span>
              <div className="flex items-center">
                <img 
                  src={token.iconHtml} 
                  alt={token.name}
                  className="w-5 h-5 rounded-full mr-2"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'https://via.placeholder.com/20';
                  }}
                />
                <span>{token.name}</span>
              </div>
            </div>
            
            <div className="h-px bg-border my-2"></div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">发送自</span>
                <div className="flex items-center">
                  <span className="font-mono text-sm">
                    {currentAccount?.address?.slice(0, 6)}...{currentAccount?.address?.slice(-4)}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(currentAccount?.address || '', 'from')}
                    className="ml-2 text-gray-400 hover:text-primary"
                  >
                    {copiedField === 'from' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">发送至</span>
                <div className="flex items-center">
                  <span className="font-mono text-sm">
                    {recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(recipientAddress, 'to')}
                    className="ml-2 text-gray-400 hover:text-primary"
                  >
                    {copiedField === 'to' ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            
            <div className="h-px bg-border my-2"></div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">网络费用</span>
                <div className="text-right">
                  <div>{fee} {token.name}</div>
                  {/* <div className="text-xs text-gray-400">≈ $0.42</div> */}
                </div>
              </div>
              
              <div className="flex justify-between font-medium">
                <span>总计</span>
                <div className="text-right">
                  <div>{totalAmount} {token.name}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-3 bg-yellow-500/10 rounded-lg flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-yellow-400 text-sm">
              请仔细检查交易详情。交易一旦发送将无法撤销。
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 border-border bg-wallet-bg">
        <button
          onClick={handleConfirm}
          disabled={isSending}
          className={`w-full py-3 rounded-xl font-medium ${
            isSending 
              ? 'bg-gray-600 text-gray-400 cursor-wait' 
              : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          {isSending ? '处理中...' : '确认发送'}
        </button>
      </div>

      {/* Password Dialog */}
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-wallet-card rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">输入密码</h3>
            <p className="text-gray-400 text-sm mb-4">
              请输入您的钱包密码以确认交易
            </p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="钱包密码"
              className="w-full p-3 bg-wallet-bg border border-border rounded-lg text-white mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPasswordDialog(false)}
                className="flex-1 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                disabled={isSending}
              >
                取消
              </button>
              <button
                onClick={handleSend}
                disabled={!password || isSending}
                className={`flex-1 py-2.5 rounded-lg font-medium ${
                  !password || isSending
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                {isSending ? '发送中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
