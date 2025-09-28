import { createContext, useContext } from 'react';

import { Account, NetworkType, WalletKeyring } from '@/shared/types';

export interface WalletController {
  boot(password: string): Promise<void>;
  isBooted(): Promise<boolean>;

  hasVault(): Promise<boolean>;

  verifyPassword(password: string): Promise<void>;
  changePassword: (password: string, newPassword: string) => Promise<void>;

  unlock(password: string): Promise<void>;
  isUnlocked(): Promise<boolean>;

  lockWallet(): Promise<void>;
  setPopupOpen(isOpen: boolean): void;
  isReady(): Promise<boolean>;

  getIsFirstOpen(): Promise<boolean>;
  updateIsFirstOpen(): Promise<void>;

  createTmpKeyringWithPrivateKey(privateKey: string): Promise<WalletKeyring>;

  removeKeyring(keyring: WalletKeyring): Promise<WalletKeyring>;

  getCurrentAccount(): Promise<Account>;
  getAccounts(): Promise<Account[]>;

  getCurrentKeyringAccounts(): Promise<Account[]>;

  getNetworkType(): Promise<NetworkType>;

  getCurrentKeyring(): Promise<WalletKeyring>;
  getKeyrings(): Promise<WalletKeyring[]>;
  changeKeyring(keyring: WalletKeyring, accountIndex?: number): Promise<void>;

  createKeyringWithPrivateKey(privateKey: string, alianName?: string): Promise<void>;
  
  getAddressHistory(params: { address: string; start: number; limit: number }): Promise<any>;

  updateAccountAlianName(accountKey: string, newName: string): Promise<void>;
  updateKeyringAlianName(keyringKey: string, newName: string): Promise<void>;
  generatePrePrivateKey(keyringType: string): Promise<{ address: string; wif: string }>;
}

const WalletContext = createContext<WalletController | null>(null);

export const WalletProvider = ({
  children,
  wallet,
}: {
  children?: React.ReactNode;
  wallet: WalletController;
}) => {
  return (
    <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>
  );
};

export const useWallet = () => {
  const wallet = useContext(WalletContext) as unknown as WalletController;
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  return wallet;
};
