import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useWallet } from '@/ui/utils/walletContext';
import { WalletKeyring } from '@/shared/types';
import { useLanguage } from '@/ui/contexts/LanguageContext';

interface EditKeyringNameProps {
  keyring: WalletKeyring;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditKeyringName({ keyring, onClose, onSuccess }: EditKeyringNameProps) {
  const [name, setName] = useState(keyring.alianName || '');
  const [loading, setLoading] = useState(false);
  const wallet = useWallet();
  const { t } = useLanguage();

  const handleSave = async () => {
    if (!name.trim()) return;
    
    setLoading(true);
    try {
      await wallet.updateKeyringAlianName(keyring.key, name.trim());
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to update keyring name:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setName(keyring.alianName || '');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-base-100 rounded-lg p-6 w-96 max-w-[90vw]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{t('account.edit_name')}</h3>
          <button
            onClick={handleCancel}
            className="btn btn-ghost btn-sm h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">{t('common.wallet_name')}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input input-bordered w-full"
            placeholder={t('common.enter_wallet_name')}
            maxLength={20}
            autoFocus
          />
          <div className="text-xs text-base-content/60 mt-1">
            {name.length}/20 {t('common.characters')}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">{t('common.wallet_type')}</label>
          <div className="text-sm text-base-content/60">
            {keyring.type}
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">{t('common.account_count')}</label>
          <div className="text-sm text-base-content/60">
            {keyring.accounts.length} {t('common.accounts')}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="btn btn-outline flex-1"
            disabled={loading}
          >
            {t('common.cancel')}
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
                {t('common.save')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
