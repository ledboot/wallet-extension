import { useState } from 'react';
import { X } from 'lucide-react';

import { WalletKeyring } from '@/shared/types';
import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useWallet } from '@/ui/utils/walletContext';

interface EditKeyringNameProps {
  keyring: WalletKeyring;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditKeyringName({
  keyring,
  onClose,
  onSuccess,
}: EditKeyringNameProps) {
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
    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/50'>
      <div className='w-[343px] max-w-[90vw] rounded-2xl bg-white p-6'>
        <h3 className='mb-6 text-center text-[20px] font-bold text-black'>
          {t('common.wallet_name')}
        </h3>

        <div className='mb-6'>
          <div className='mb-1 flex items-center rounded-xl bg-[#F5F5F5] p-3'>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='flex-1 bg-transparent text-sm text-black outline-none placeholder:text-[#999999]'
              placeholder={t('common.enter_wallet_name')}
              maxLength={25}
              autoFocus
            />
            {name && (
              <button
                onClick={() => setName('')}
                className='ml-2 flex-shrink-0 rounded-full bg-[#999999] p-0.5 text-white'
              >
                <X className='h-3 w-3' />
              </button>
            )}
          </div>
          <div className='text-right text-sm text-[#999999]'>
            {name.length}/25
          </div>
        </div>

        <div className='flex gap-3'>
          <button
            onClick={handleCancel}
            className='flex flex-1 items-center justify-center rounded-[24px] bg-[#F5F5F5] px-4 py-3 text-base font-semibold text-black transition-colors hover:bg-[#EBEBEB]'
            disabled={loading}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !name.trim() || name === keyring.alianName}
            className={`flex flex-1 items-center justify-center rounded-[24px] px-4 py-3 text-base font-semibold transition-colors
              ${
                !name.trim() || loading || name === keyring.alianName
                  ? 'bg-[#F5F5F5] text-[#CCCCCC]'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}
          >
            {loading ? (
              <span className='loading loading-spinner loading-sm'></span>
            ) : (
              t('common.confirm')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
