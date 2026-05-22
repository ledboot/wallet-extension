import React, { useEffect, useState } from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useWallet } from '@/ui/utils/walletContext';
import { useLanguage } from '@/ui/contexts/LanguageContext';
import { getApprovalId } from '@/ui/utils';

interface ApprovalLayoutProps {
  children: React.ReactNode;
  id: string | null;
  onInit?: (request: any) => void;
}

const ApprovalLayout: React.FC<ApprovalLayoutProps> = ({ children, id, onInit }) => {
  const wallet = useWallet();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<any>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    const init = async () => {
      const actualId = id || getApprovalId();
      if (actualId) {
        try {
          const [req, unlocked] = await Promise.all([
            wallet.getApproval(actualId),
            wallet.isUnlocked(),
          ]);
          setRequest(req);
          setIsUnlocked(unlocked);
          if (onInit) onInit(req);
        } catch (error) {
          console.error('Failed to init approval:', error);
        } finally {
          setLoading(false);
        }
      } else {
        console.warn('[ApprovalLayout] No approval ID found');
        setLoading(false);
      }
    };
    init();
  }, [id, wallet, onInit]);


  const handleUnlock = async () => {
    try {
      await wallet.unlock(password);
      setIsUnlocked(true);
    } catch (error: any) {
      toast.error(t('password.unlock_failed').replace('{error}', error.message || t('common.error')));
    }
  };

  const handleCancel = async () => {
    if (id) {
      await wallet.rejectApproval(id);
    }
  };

  if (loading || !request) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-gray-900" />
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="flex flex-col h-screen bg-white text-gray-900 px-8">
        <div className="flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mb-8 border border-gray-100 shadow-sm">
                <Lock className="w-10 h-10 text-gray-900" />
            </div>
            <h1 className="text-xl font-bold mb-3">Unlock Wallet</h1>
            <p className="text-sm text-gray-500 mb-10 max-w-60">
                Enter your password to unlock ZENT Wallet and proceed.
            </p>
            
            <div className="w-full space-y-4">
                <input
                    type="password"
                    autoFocus
                    placeholder="Enter password"
                    className="w-full rounded-2xl bg-gray-50 p-4 text-base font-semibold text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 text-center"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                />
                <button
                    onClick={handleUnlock}
                    disabled={!password}
                    className="w-full rounded-full bg-gray-900 py-4 font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none disabled:opacity-20 flex items-center justify-center space-x-2"
                >
                    <span>Unlock</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
        
        <div className="py-10 text-center">
            <button 
                onClick={handleCancel}
                className="text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors"
            >
                Cancel request
            </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ApprovalLayout;
