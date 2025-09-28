import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useWallet } from '@/ui/utils/walletContext';
import { Account } from '@/shared/types';

interface EditAccountNameProps {
  account: Account;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditAccountName({ account, onClose, onSuccess }: EditAccountNameProps) {
  const [name, setName] = useState(account.alianName || '');
  const [loading, setLoading] = useState(false);
  const wallet = useWallet();

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      await wallet.updateAccountAlianName(account.key, name.trim());
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to update account name:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(account.alianName || '');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg p-6 w-96 max-w-[90vw]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">编辑账户名称</h3>
          <button
            onClick={handleCancel}
            className="btn btn-ghost btn-sm h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">账户名称</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered w-full"
            placeholder="请输入账户名称"
            maxLength={20}
            autoFocus
          />
          <div className="text-xs text-base-content/60 mt-1">
            {name.length}/20 字符
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">账户地址</label>
          <div className="text-sm text-base-content/60 font-mono">
            {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="btn btn-outline flex-1"
            disabled={loading}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="btn btn-primary flex-1"
            disabled={loading || !name.trim()}
          >
            {loading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>
                <Check className="h-4 w-4 mr-1" />
                保存
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
