import { useEffect, useState } from 'react';
import { Account, WalletKeyring } from '@shared/types';
import { Check, Edit3, MoreHorizontal, Trash2, X } from 'lucide-react';
import { useLocation } from 'react-router';

import { EditAccountName } from '@/ui/components/EditAccountName';
import { EditKeyringName } from '@/ui/components/EditKeyringName';
import { PixelAvatar } from '@/ui/components/PixelAvatar';
import { useLanguage } from '@/ui/contexts/LanguageContext';
import { useNavigate } from '@/ui/pages/mainRoute';
import { useCurrentKeyring, useKeyringsList } from '@/ui/state/hooks';
import { useWallet } from '@/ui/utils/walletContext';

const AccountSelection = () => {
  const navigate = useNavigate();
  const wallet = useWallet();
  const location = useLocation();
  const { t } = useLanguage();
  const currentAccountFromState = (location.state as any)?.currentAccount as
    | Account
    | undefined;
  const [selectedKeyringIndex, setSelectedKeyringIndex] = useState(0);
  const [selectedAccountIndex, setSelectedAccountIndex] = useState(0);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editingKeyring, setEditingKeyring] = useState<WalletKeyring | null>(
    null
  );
  const [isEditingMode, setIsEditingMode] = useState(false);
  const keyringsList = useKeyringsList();
  const currentKeyring = useCurrentKeyring();
  useEffect(() => {
    if (currentAccountFromState && keyringsList && keyringsList.length > 0) {
      for (let k = 0; k < keyringsList.length; k++) {
        const accIdx = keyringsList[k].accounts.findIndex(
          (a) => a.address === currentAccountFromState.address
        );
        if (accIdx >= 0) {
          setSelectedKeyringIndex(k);
          setSelectedAccountIndex(accIdx);
          break;
        }
      }
    }
  }, [keyringsList, currentAccountFromState]);

  const handleAccountSelect = (
    keyring: WalletKeyring,
    accountIndex: number
  ) => {
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

  const handleViewAccountDetail = (
    account: Account,
    keyring: WalletKeyring,
    e: React.MouseEvent
  ) => {
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

  const handleDeleteAccount = async (
    account: Account,
    keyring: WalletKeyring,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    const confirmMessage = t('account.confirm_delete_account_specific').replace(
      '{name}',
      account.alianName || 'Unknown Account'
    );
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await wallet.removeAccount(account.address, account.type);
      alert(t('account.delete_account_success'));
      // Refresh keyrings data
      await wallet.updateInit(0, 10);
    } catch (error: any) {
      console.error('Failed to delete account:', error);
      const errorMessage = t('account.delete_account_failed').replace(
        '{error}',
        error.message || t('common.error')
      );
      alert(errorMessage);
    }
  };

  const handleDeleteKeyring = async (
    keyring: WalletKeyring,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();

    const walletName = keyring.alianName || `Keyring ${keyring.index + 1}`;
    const confirmMessage = t('account.confirm_delete_keyring_specific').replace(
      '{name}',
      walletName
    );
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      await wallet.removeKeyring(keyring.key);
      alert(t('account.delete_wallet_success'));
      // Refresh keyrings data
      await wallet.updateInit(0, 10);
    } catch (error: any) {
      console.error('Failed to delete keyring:', error);
      const errorMessage = t('account.delete_wallet_failed').replace(
        '{error}',
        error.message || t('common.error')
      );
      alert(errorMessage);
    }
  };

  return (
    <div className='h-full w-full bg-base-100'>
      {/* Fixed Header */}
      <div className='fixed left-0 right-0 top-0 h-14 border-b border-base-300 bg-base-100'>
        <div className='flex items-center justify-between px-4 py-3'>
          <h2 className='text-lg font-semibold'>
            {t('account.select_wallet')}
          </h2>
          <button
            className='btn btn-ghost btn-sm h-8 w-8 p-0'
            onClick={() => navigate('MainScreen')}
          >
            <X className='h-4 w-4' />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className='hide-scrollbar h-[calc(100vh-56px)] space-y-4 overflow-y-auto pb-20 pt-14'>
        {keyringsList.map((kr, kIndex) => (
          <div key={kr.key || kIndex}>
            <div className='text-base-content/60 flex items-center justify-between px-4 py-2 text-xs'>
              <span>{kr.alianName || `Keyring ${kIndex + 1}`}</span>
              <div className='flex items-center space-x-1'>
                {isEditingMode && (
                  <>
                    <button
                      onClick={(e) => handleEditKeyring(kr, e)}
                      className='btn btn-ghost btn-xs h-6 w-6 p-0'
                      title={t('account.edit_name')}
                    >
                      <Edit3 className='h-3 w-3' />
                    </button>
                    {keyringsList.length > 1 && (
                      <button
                        onClick={(e) => handleDeleteKeyring(kr, e)}
                        className='btn btn-ghost btn-xs h-6 w-6 p-0 text-error hover:bg-error/10'
                        title={t('account.delete_wallet')}
                      >
                        <Trash2 className='h-3 w-3' />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
            <div className='space-y-2 px-4'>
              {kr.accounts.map((account: Account, aIndex: number) => (
                <button
                  key={account.key || aIndex}
                  onClick={() => handleAccountSelect(kr, aIndex)}
                  className='w-full rounded-lg border border-base-300 p-3 text-left transition-colors hover:bg-gray-100'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      <PixelAvatar
                        seed={account.address || account.key || 'default'}
                        size={32}
                        borderRadius={8}
                      />
                      <div>
                        <div className='text-sm font-medium'>
                          {account.alianName}
                        </div>
                        <div className='text-base-content/60 text-xs'>
                          {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      {isEditingMode && (
                        <>
                          <div
                            onClick={(e) => handleEditAccount(account, e)}
                            className='btn btn-ghost btn-xs h-6 w-6 cursor-pointer p-0'
                            title={t('account.edit_name')}
                          >
                            <Edit3 className='h-3 w-3' />
                          </div>
                          <div
                            onClick={(e) =>
                              handleViewAccountDetail(account, kr, e)
                            }
                            className='btn btn-ghost btn-xs h-6 w-6 cursor-pointer p-0'
                            title={t('account.about_account')}
                          >
                            <MoreHorizontal className='h-3 w-3' />
                          </div>
                          {kr.accounts.length > 1 && (
                            <div
                              onClick={(e) =>
                                handleDeleteAccount(account, kr, e)
                              }
                              className='btn btn-ghost btn-xs h-6 w-6 cursor-pointer p-0 text-error hover:bg-error/10'
                              title={t('account.delete_account')}
                            >
                              <Trash2 className='h-3 w-3' />
                            </div>
                          )}
                        </>
                      )}
                      {!isEditingMode &&
                        selectedKeyringIndex === kIndex &&
                        selectedAccountIndex === aIndex && (
                          <Check className='h-4 w-4 text-primary' />
                        )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Fixed Bottom Actions */}
      <div className='fixed bottom-0 left-0 right-0 border-t border-base-300 bg-base-100'>
        <div className='grid grid-cols-2 gap-3 px-4 py-3'>
          <button
            className={`btn ${isEditingMode ? 'btn-active' : 'btn-outline'}`}
            onClick={() => setIsEditingMode(!isEditingMode)}
          >
            {isEditingMode ? t('common.cancel') : t('common.edit')}
          </button>
          <button
            className='btn btn-primary'
            onClick={() => navigate('WelcomeScreen')}
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
    </div>
  );
};

export default AccountSelection;
