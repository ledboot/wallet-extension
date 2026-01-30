import { X, Check, Edit3, Trash2 } from "lucide-react";
import { useNavigate } from "@/ui/pages/mainRoute";
import { useState,useEffect } from "react";
import { useLocation } from 'react-router';
import { Account, WalletKeyring } from "@shared/types";
import { useCurrentKeyring, useKeyringsList } from "@/ui/state/hooks";
import { EditAccountName } from "@/ui/components/EditAccountName";
import { EditKeyringName } from "@/ui/components/EditKeyringName";
import { useWallet } from "@/ui/utils/walletContext";
import { useLanguage } from "@/ui/contexts/LanguageContext";

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
  

  const handleAccountSelect = (keyring: WalletKeyring, accountIndex: number) => {
    if (keyring.key === currentKeyring.key) {
      navigate("MainScreen");
      return;
    }
    console.log('handleAccountSelect', keyring.key, accountIndex);
    setSelectedKeyringIndex(keyring.index);
    setSelectedAccountIndex(accountIndex);
    wallet.changeKeyring(keyring.key, accountIndex);
    navigate("MainScreen");
  };

  const handleEditAccount = (account: Account, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAccount(account);
  };

  const handleEditKeyring = (keyring: WalletKeyring, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingKeyring(keyring);
  };

  const handleDeleteAccount = async (account: Account, keyring: WalletKeyring, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const confirmMessage = t('account.confirm_delete_account_specific').replace('{name}', account.alianName || 'Unknown Account');
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
      const errorMessage = t('account.delete_account_failed').replace('{error}', error.message || t('common.error'));
      alert(errorMessage);
    }
  };

  const handleDeleteKeyring = async (keyring: WalletKeyring, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const walletName = keyring.alianName || `Keyring ${keyring.index + 1}`;
    const confirmMessage = t('account.confirm_delete_keyring_specific').replace('{name}', walletName);
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
      const errorMessage = t('account.delete_wallet_failed').replace('{error}', error.message || t('common.error'));
      alert(errorMessage);
    }
  };

  return (
    <div className="w-full h-full bg-base-100">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-base-100 border-b border-base-300 h-14">
        <div className="px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t('account.select_wallet')}</h2>
          <button
            className="btn btn-ghost btn-sm h-8 w-8 p-0"
            onClick={() => navigate("MainScreen")}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="pt-14 pb-20 space-y-4 overflow-y-auto h-[calc(100vh-56px)] hide-scrollbar">
        {keyringsList.map((kr, kIndex) => (
          <div key={kr.key || kIndex}>
            <div className="px-4 py-2 text-xs text-base-content/60 flex items-center justify-between">
              <span>{kr.alianName || `Keyring ${kIndex + 1}`}</span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={(e) => handleEditKeyring(kr, e)}
                  className="btn btn-ghost btn-xs h-6 w-6 p-0"
                  title={t('account.edit_name')}
                >
                  <Edit3 className="h-3 w-3" />
                </button>
                {keyringsList.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteKeyring(kr, e)}
                    className="btn btn-ghost btn-xs h-6 w-6 p-0 text-error hover:bg-error/10"
                    title={t('account.delete_wallet')}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-2 px-4">
              {kr.accounts.map((account: Account, aIndex: number) => (
                <button
                  key={account.key || aIndex}
                  onClick={() => handleAccountSelect(kr, aIndex)}
                  className="w-full p-3 hover:bg-gray-100 transition-colors text-left rounded-lg border border-base-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <span className="text-sm font-bold text-primary-content">
                          {account.alianName?.charAt(account.alianName?.length - 1)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-sm">{account.alianName}</div>
                        <div className="text-xs text-base-content/60">
                          {`${account.address.slice(0, 6)}...${account.address.slice(-4)}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        onClick={(e) => handleEditAccount(account, e)}
                        className="btn btn-ghost btn-xs h-6 w-6 p-0 cursor-pointer"
                        title={t('account.edit_name')}
                      >
                        <Edit3 className="h-3 w-3" />
                      </div>
                      {kr.accounts.length > 1 && (
                        <div
                          onClick={(e) => handleDeleteAccount(account, kr, e)}
                          className="btn btn-ghost btn-xs h-6 w-6 p-0 cursor-pointer text-error hover:bg-error/10"
                          title={t('account.delete_account')}
                        >
                          <Trash2 className="h-3 w-3" />
                        </div>
                      )}
                      {selectedKeyringIndex === kIndex && selectedAccountIndex === aIndex && (
                        <Check className="h-4 w-4 text-primary" />
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
      <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t border-base-300">
        <div className="px-4 py-3 grid grid-cols-2 gap-3">
          <button className="btn btn-outline">{t('common.edit')}</button>
          <button className="btn btn-primary" onClick={()=>navigate("WelcomeScreen")}>{t('account.add_wallet')}</button>
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