import { useState } from 'react';
import { Account } from '@shared/types';
import { ChevronLeft, ChevronRight, Edit2, X } from 'lucide-react';
import { useLocation } from 'react-router';
import { toast } from 'sonner';

import { ConfirmModal } from '@/ui/components/ConfirmModal';
import { PixelAvatar } from '@/ui/components/PixelAvatar';
import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useKeyringsList } from '@/ui/state/hooks';
import { useWallet } from '@/ui/utils/walletContext';

interface EditNameModalProps {
  account: Account;
  onClose: () => void;
  onSuccess: (newName: string) => void;
}

function EditNameModal({ account, onClose, onSuccess }: EditNameModalProps) {
  const [name, setName] = useState(account.alianName || '');
  const [loading, setLoading] = useState(false);
  const wallet = useWallet();
  const { t } = useLanguage();

  const handleSave = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await wallet.updateAccountAlianName(account.key, name.trim());
      onSuccess(name.trim());
      onClose();
    } catch (err) {
      console.error('Failed to update account name:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center bg-black/50'>
      <div className='w-[343px] max-w-[90vw] rounded-2xl bg-white p-6'>
        <h3 className='mb-6 text-center text-[20px] font-bold text-black'>{t('common.account_name')}</h3>
        <div className='mb-6'>
          <div className='mb-1 flex items-center rounded-xl bg-[#F5F5F5] p-3'>
            <input
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              className='flex-1 bg-transparent text-sm text-black outline-none placeholder:text-[#999999]'
              placeholder={t('common.enter_account_name')}
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
          <div className='text-right text-sm text-[#999999]'>{name.length}/25</div>
        </div>
        <div className='flex gap-3'>
          <button
            onClick={onClose}
            className='flex flex-1 items-center justify-center rounded-[24px] bg-[#F5F5F5] px-4 py-3 text-base font-semibold text-black transition-colors hover:bg-[#EBEBEB]'
            disabled={loading}
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !name.trim() || name === account.alianName}
            className={`flex flex-1 items-center justify-center rounded-[24px] px-4 py-3 text-base font-semibold transition-colors ${
              !name.trim() || loading || name === account.alianName
                ? 'bg-[#F5F5F5] text-[#CCCCCC]'
                : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            {loading ? <span className='loading loading-spinner loading-sm'></span> : t('common.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
}

const AccountDetailScreen = () => {
  const navigate = useNavigate();
  const wallet = useWallet();
  const location = useLocation();
  const { t } = useLanguage();
  const keyrings = useKeyringsList();

  const account = (location.state as any)?.account as Account | undefined;

  const [displayName, setDisplayName] = useState(account?.alianName || '');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  if (!account) {
    navigate('#back');
    return null;
  }

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteAccount = async () => {
    setShowDeleteModal(false);
    try {
      await wallet.removeAccount(account.address, account.type);
      toast.success(t('account.delete_account_success'));
      navigate('AccountSelection');
    } catch (error: any) {
      console.error('Failed to delete account:', error);
      toast.error(t('account.delete_account_failed').replace('{error}', error.message || t('common.error')));
    }
  };

  const handleViewAddress = () => {
    // Navigate to receive screen to view full address/QR
    navigate('ReceiveScreen');
  };

  const handleViewPrivateKey = () => {
    navigate('ExportPrivateKeyScreen', { account });
  };

  const canDelete = (keyrings.length ?? 2) > 1;

  return (
    <div className='flex h-full w-full flex-col bg-white'>
      {/* Header */}
      <div className='absolute left-0 top-0 z-10 flex h-14 w-full items-center justify-between border-b border-gray-100 bg-white px-4'>
        <button
          onClick={() => navigate('#back')}
          className='-ml-2 rounded-full p-2 transition-colors hover:bg-gray-100'
        >
          <ChevronLeft className='h-5 w-5 text-gray-800' />
        </button>
        <h1 className='absolute left-1/2 -translate-x-1/2 transform text-lg font-semibold text-gray-900'>
          {t('account.about_account')}
        </h1>
        <div className='h-9 w-9'></div>
      </div>

      {/* Content */}
      <div className='flex flex-1 flex-col items-center pb-6 pt-20'>
        {/* Avatar */}
        <PixelAvatar seed={account.address || account.key || 'default'} size={80} borderRadius={16} />

        {/* Account name with edit icon */}
        <div className='mt-4 flex items-center gap-2'>
          <span className='text-xl font-bold text-gray-900'>{displayName}</span>
          <button
            onClick={() => setShowEditModal(true)}
            className='rounded-full p-1 transition-colors hover:bg-gray-100'
            title={t('account.edit_name')}
          >
            <Edit2 className='h-4 w-4 text-gray-400' />
          </button>
        </div>

        {/* Menu items */}
        <div className='mt-8 w-full border-t border-gray-100'>
          {/* Address */}
          <button
            onClick={handleViewAddress}
            className='flex w-full items-center justify-between border-b border-gray-100 px-4 py-4 text-left transition-colors hover:bg-gray-50'
          >
            <span className='text-sm font-medium text-gray-900'>{t('common.account_address')}</span>
            <ChevronRight className='h-4 w-4 text-gray-400' />
          </button>

          {/* Private key */}
          <button
            onClick={handleViewPrivateKey}
            className='flex w-full items-center justify-between border-b border-gray-100 px-4 py-4 text-left transition-colors hover:bg-gray-50'
          >
            <span className='text-sm font-medium text-gray-900'>{t('account.private_key')}</span>
            <ChevronRight className='h-4 w-4 text-gray-400' />
          </button>
        </div>

        {/* Delete account */}
        {canDelete && (
          <div className='px-4 py-3'>
            <button
              onClick={handleDeleteAccount}
              className='w-full py-2.5 text-sm font-medium text-red-500 transition-colors hover:cursor-pointer'
            >
              {t('account.delete_account')}
            </button>
          </div>
        )}
      </div>

      {/* Edit name modal */}
      {showEditModal && (
        <EditNameModal
          account={{ ...account, alianName: displayName }}
          onClose={() => setShowEditModal(false)}
          onSuccess={(newName) => setDisplayName(newName)}
        />
      )}

      {/* Delete confirm modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        message={t('account.confirm_delete_account_specific').replace('{name}', displayName || 'Unknown Account')}
        onConfirm={confirmDeleteAccount}
        onCancel={() => setShowDeleteModal(false)}
        confirmText={t('account.delete_account')}
      />
    </div>
  );
};

export default AccountDetailScreen;
