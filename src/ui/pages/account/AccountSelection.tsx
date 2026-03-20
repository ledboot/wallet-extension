import { useEffect, useState } from 'react';
import { Account, WalletKeyring } from '@shared/types';
import { Check, Edit3, MoreHorizontal, Trash2, X } from 'lucide-react';
import { useLocation } from 'react-router';
import { toast } from 'sonner';

import { ConfirmModal } from '@/ui/components/ConfirmModal';
import { EditAccountName } from '@/ui/components/EditAccountName';
import { EditKeyringName } from '@/ui/components/EditKeyringName';
import { PixelAvatar } from '@/ui/components/PixelAvatar';
import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useNavigate } from '@/ui/pages/MainRoute';
import { useCurrentKeyring, useKeyringsList } from '@/ui/state/hooks';
import { useWallet } from '@/ui/utils/walletContext';

const AccountSelection = () => {
  const navigate = useNavigate();
  const wallet = useWallet();
  const location = useLocation();
  const { t } = useLanguage();
  const currentAccountFromState = (location.state as any)?.currentAccount as Account | undefined;
  const [selectedKeyringIndex, setSelectedKeyringIndex] = useState(0);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingKeyring, setEditingKeyring] = useState<WalletKeyring | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);

  type DeleteCtx = { type: 'account'; account: Account } | { type: 'keyring'; keyring: WalletKeyring };

  const [deleteModalState, setDeleteModalState] = useState<DeleteCtx | null>(null);
  const keyringsList = useKeyringsList();
  const currentKeyring = useCurrentKeyring();
  useEffect(() => {
    if (currentAccountFromState && keyringsList && keyringsList.length > 0) {
      for (let k = 0; k < keyringsList.length; k++) {
        const accIdx = keyringsList[k].accounts.findIndex((a) => a.address === currentAccountFromState.address);
        if (accIdx >= 0) {
          setSelectedKeyringIndex(k);
          setSelectedAccountIndex(accIdx);
          break;
        }
      }
    }
  }, [keyringsList, currentAccountFromState]);

  const handleAccountSelect = (keyring: WalletKeyring, accountIndex: number) => {
    if (keyring.key === currentKeyring.key) {
      navigate('MainScreen');
      return;
    }
    console.log('handleAccountSelect', keyring.key, accountIndex);
    setSelectedKeyringIndex(keyring.index);
    setSelectedAccountIndex(accountIndex);
    wallet.changeKeyring(keyring.key, accountIndex);
    navigate('MainScreen');
  };

  const handleEditAccount = (account: Account, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAccount(account);
  };

  const handleViewAccountDetail = (account: Account, keyring: WalletKeyring, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('AccountDetailScreen', {
      account,
      keyringKey: keyring.key,
      keyringLength: keyring.accounts.length,
    });
  };

  const handleEditKeyring = (keyring: WalletKeyring, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingKeyring(keyring);
  };

  const handleDeleteAccount = (account: Account, keyring: WalletKeyring, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModalState({ type: 'account', account });
  };

  const handleDeleteKeyring = (keyring: WalletKeyring, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteModalState({ type: 'keyring', keyring });
  };

  const confirmDelete = async () => {
    if (!deleteModalState) return;

    if (deleteModalState.type === 'account') {
      const { account } = deleteModalState;
      try {
        await wallet.removeAccount(account.address, account.type);
        toast.success(t('account.delete_account_success'));
      } catch (error: any) {
        console.error('Failed to delete account:', error);
        toast.error(t('account.delete_account_failed').replace('{error}', error.message || t('common.error')));
      }
    } else if (deleteModalState.type === 'keyring') {
      const { keyring } = deleteModalState;
      try {
        await wallet.removeKeyring(keyring.key);
        toast.success(t('account.delete_wallet_success'));
      } catch (error: any) {
        console.error('Failed to delete keyring:', error);
        toast.error(t('account.delete_wallet_failed').replace('{error}', error.message || t('common.error')));
      }
    }
    setDeleteModalState(null);
  };

  return (
    <div className='flex h-full w-full flex-col bg-white'>
      {/* Fixed Header */}
      <div className='absolute left-0 top-0 z-10 flex h-14 w-full items-center justify-between border-b border-gray-100 bg-white px-4'>
        <div className='h-8 w-8' /> {/* Spacer for centering */}
        <h2 className='absolute left-1/2 -translate-x-1/2 transform text-lg font-semibold text-gray-900'>
          {t('account.select_wallet')}
        </h2>
        <button
          className='-mr-2 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-gray-100'
          onClick={() => navigate('MainScreen')}
        >
          <X className='h-5 w-5 text-gray-800' />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className='hide-scrollbar flex-1 overflow-y-auto bg-white px-4 pb-[88px] pt-16'>
        {keyringsList.map((kr, kIndex) => (
          <div key={kr.key || kIndex} className='mb-6'>
            <div className='mb-2 flex items-center justify-between px-1'>
              <span className='text-xs font-semibold uppercase tracking-wider text-gray-500'>
                {kr.alianName || `Keyring ${kIndex + 1}`}
              </span>
              <div className='flex items-center space-x-2'>
                {isEditingMode && (
                  <>
                    <button
                      onClick={(e) => handleEditKeyring(kr, e)}
                      className='flex h-6 w-6 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900'
                      title={t('account.edit_name')}
                    >
                      <Edit3 className='h-3.5 w-3.5' />
                    </button>
                    {keyringsList.length > 1 && (
                      <button
                        onClick={(e) => handleDeleteKeyring(kr, e)}
                        className='flex h-6 w-6 items-center justify-center rounded-full text-red-400 transition-colors hover:bg-red-50 hover:text-red-600'
                        title={t('account.delete_wallet')}
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className='flex flex-col space-y-3'>
              {kr.accounts.map((account: Account, aIndex: number) => {
                const isSelected = !isEditingMode && selectedKeyringIndex === kIndex && selectedAccountIndex === aIndex;
                return (
                  <button
                    key={account.key || aIndex}
                    onClick={() => handleAccountSelect(kr, aIndex)}
                    className={`flex w-full items-center justify-between rounded-2xl p-4 transition-colors ${
                      isSelected ? 'bg-gray-100/80 ring-1 ring-gray-200' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className='flex items-center space-x-3 overflow-hidden'>
                      <div className='shrink-0 rounded-xl bg-white p-0.5 shadow-sm ring-1 ring-gray-100'>
                        <PixelAvatar seed={account.address || account.key || 'default'} size={36} borderRadius={10} />
                      </div>
                      <div className='min-w-0 pr-2 text-left'>
                        <div
                          className={`truncate text-sm font-semibold ${isSelected ? 'text-gray-900' : 'text-gray-800'}`}
                        >
                          {account.alianName}
                        </div>
                        <div className='truncate text-xs font-medium text-gray-500'>
                          {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                        </div>
                      </div>
                    </div>

                    <div className='flex shrink-0 items-center space-x-1.5'>
                      {isEditingMode ? (
                        <>
                          <div
                            onClick={(e) => handleEditAccount(account, e)}
                            className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-900'
                            title={t('account.edit_name')}
                          >
                            <Edit3 className='h-4 w-4' />
                          </div>
                          <div
                            onClick={(e) => handleViewAccountDetail(account, kr, e)}
                            className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-900'
                            title={t('account.about_account')}
                          >
                            <MoreHorizontal className='h-4 w-4' />
                          </div>
                          {kr.accounts.length > 1 && (
                            <div
                              onClick={(e) => handleDeleteAccount(account, kr, e)}
                              className='flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-red-400 transition-colors hover:bg-red-50 hover:text-red-600'
                              title={t('account.delete_account')}
                            >
                              <Trash2 className='h-4 w-4' />
                            </div>
                          )}
                        </>
                      ) : isSelected ? (
                        <div className='ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-900'>
                          <Check className='h-3.5 w-3.5 text-white' />
                        </div>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Fixed Bottom Actions */}
      <div className='absolute bottom-0 left-0 right-0 border-t border-gray-100 bg-white px-4 py-4'>
        <div className='grid grid-cols-2 gap-4'>
          <button
            className={`flex items-center justify-center rounded-full py-3.5 text-sm font-semibold transition-colors ${
              isEditingMode
                ? 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => setIsEditingMode(!isEditingMode)}
          >
            {isEditingMode ? t('common.cancel') : t('common.edit')}
          </button>
          <button
            className='flex items-center justify-center rounded-full bg-gray-900 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-gray-800'
            onClick={() => navigate('WelcomeScreen', { fromWalletSelection: true })}
          >
            {t('account.add_wallet')}
          </button>
        </div>
      </div>

      {/* 编辑账户名称弹窗 */}
      {editingAccount && (
        <EditAccountName
          account={editingAccount}
          onClose={() => setEditingAccount(null)}
          onSuccess={() => {
            // 可以在这里添加成功后的处理逻辑
            console.log('Account name updated successfully');
          }}
        />
      )}

      {/* 编辑钱包名称弹窗 */}
      {editingKeyring && (
        <EditKeyringName
          keyring={editingKeyring}
          onClose={() => setEditingKeyring(null)}
          onSuccess={() => {
            // 可以在这里添加成功后的处理逻辑
            console.log('Keyring name updated successfully');
          }}
        />
      )}

      {/* Delete confirm modal */}
      <ConfirmModal
        isOpen={!!deleteModalState}
        message={
          deleteModalState?.type === 'account'
            ? t('account.confirm_delete_account_specific').replace(
                '{name}',
                deleteModalState.account.alianName || 'Unknown Account'
              )
            : deleteModalState?.type === 'keyring'
              ? t('account.confirm_delete_keyring_specific').replace(
                  '{name}',
                  deleteModalState.keyring.alianName || `Keyring ${deleteModalState.keyring.index + 1}`
                )
              : ''
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteModalState(null)}
        confirmText={deleteModalState?.type === 'account' ? t('account.delete_account') : t('account.delete_wallet')}
      />
    </div>
  );
};

export default AccountSelection;
