import { ChevronLeft, Copy, Clock, Check } from 'lucide-react';
import { useLocation } from 'react-router';
import { useNavigate } from '@/ui/pages/mainRoute';
import { useCurrentAccount } from '@/ui/state/hooks';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import type { transferAddressHistory } from '@/shared/types';
import { useWallet } from '@/ui/utils/walletContext';

interface LocationState {
  token: any;
}

export default function RecipientAddressScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentAccount = useCurrentAccount();
  const { token } = (location.state || {}) as LocationState;
  
  const [recipientAddress, setRecipientAddress] = useState('');
  const [recentAddresses, setRecentAddresses] = useState<transferAddressHistory[]>([]);
  const [isValidAddress, setIsValidAddress] = useState(false);
  const wallet = useWallet();

  // Mock recent addresses - in a real app, this would come from a service
  useEffect(() => {
    const fetchRecentAddresses = async () => {
      try {
        const addresses = await wallet.getTransferAddressHistory();
        // 按 updated 从大到小排序
        const sortedAddresses = [...addresses].sort((a, b) => {
          const timeA = a.updated || 0;
          const timeB = b.updated || 0;
          return timeB - timeA; // 降序排序
        });
        setRecentAddresses(sortedAddresses);
      } catch (error) {
        console.error('Failed to fetch recent addresses:', error);
        setRecentAddresses([]); // Set to empty array or handle error appropriately
      }
    };
    fetchRecentAddresses();
  }, [wallet]);

  const formatAddress = (address: string): string => {
    if (!address || address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setRecipientAddress(text.trim());
      validateAddress(text.trim());
    } catch (err) {
      toast.error('Failed to read from clipboard');
    }
  };

  const validateAddress = (address: string) => {
    // TODO: Implement actual address validation based on token type
    const isValid = address.length > 20; // Simple validation for demo
    setIsValidAddress(isValid);
    return isValid;
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setRecipientAddress(value);
    validateAddress(value);
  };

  const handleContinue = () => {
    if (!isValidAddress) return;
    
    navigate('AmountInputScreen', { 
      token,
      recipientAddress,
    });
  };

  const selectRecentAddress = (address: string) => {
    setRecipientAddress(address);
    validateAddress(address);
  };

  if (!token) {
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
        <h1 className='text-lg font-semibold'>发送 {token.name}</h1>
        <div className='w-10' />
      </div>

      <div className="flex-1 overflow-y-auto bg-wallet-bg px-4 py-6">
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={recipientAddress}
              onChange={handleAddressChange}
              placeholder={`输入${token.name}收款地址`}
              className="w-full p-4 pr-12 bg-wallet-card border border-border rounded-xl placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <button
              onClick={handlePaste}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-primary hover:text-primary/80"
              title="粘贴地址"
            >
              <Copy className="h-5 w-5" />
            </button>
          </div>
          
          {!isValidAddress && recipientAddress && (
            <p className="mt-2 text-sm text-red-500">无效的地址</p>
          )}
        </div>

        {recentAddresses.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-400 mb-3">最近使用</h3>
            <div className="space-y-2">
              {recentAddresses.map((item, index) => (
                <div
                  key={index}
                  onClick={() => selectRecentAddress(item.address)}
                  className="flex items-center justify-between p-3 bg-wallet-card rounded-lg border border-border active:bg-wallet-card/80 transition-colors"
                >
                  <div>
                    <div className="font-medium ">{item.address ? item.address.substring(0, 6) + '...' + item.address.substring(item.address.length - 4) : ''}</div>
                    <div className="text-xs text-gray-400 font-mono truncate w-48">{item.address}</div>
                  </div>
                  <div className="flex items-center text-xs text-gray-400">
                    <Clock className="h-3.5 w-3.5 mr-1" />
                    {item.updated ? new Date(item.updated).toLocaleDateString() : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-border bg-wallet-bg">
        <button
          onClick={handleContinue}
          disabled={!isValidAddress}
          className={`w-full py-3 rounded-xl font-medium ${
            isValidAddress 
              ? 'bg-primary text-white hover:bg-primary/90' 
              : 'bg-gray-600 text-gray-400 cursor-not-allowed'
          }`}
        >
          继续
        </button>
      </div>
    </div>
  );
}
