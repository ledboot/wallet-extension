import { createContext, useContext } from 'react';

import { ChainType, NetworkType } from '@/shared/constants';
import {
  Account,
  ChainInfo,
  CoinNames,
  transferAddressHistory,
  UtxoAddressSumInfo,
  WalletKeyring,
} from '@/shared/types';

export interface WalletController {
  boot(password: string): Promise<void>;
  isBooted(): Promise<boolean>;

  hasVault(): Promise<boolean>;

  verifyPassword(password: string): Promise<void>;
  changePassword: (password: string, newPassword: string) => Promise<void>;

  unlock(password: string): Promise<void>;
  isUnlocked(): Promise<boolean>;

  lockWallet(): Promise<void>;
  setAutoLockTimeId(timeId: number): Promise<void>;
  getAutoLockTimeId(): Promise<number>;
  setPopupOpen(isOpen: boolean): void;
  isReady(): Promise<boolean>;

  getIsFirstOpen(): Promise<boolean>;
  updateIsFirstOpen(): Promise<void>;

  removeKeyring(keyringKey: string): Promise<WalletKeyring>;
  removeAccount(address: string, type: string): Promise<void>;

  getCurrentAccount(): Promise<Account>;
  getAccounts(): Promise<Account[]>;

  getCurrentKeyringAccounts(): Promise<Account[]>;

  getNetworkType(): Promise<NetworkType>;
  changeNetwork(chainType: ChainType): Promise<void>;

  getCurrentKeyring(): Promise<WalletKeyring>;
  getKeyrings(): Promise<WalletKeyring[]>;

  changeKeyring(keyringKey: string, accountIndex?: number): Promise<void>;

  // createKeyringWithPrivateKey(privateKey: string, compressed: boolean, alianName?: string): Promise<void>;
  importPrivateKey(wif: string): Promise<void>;

  getAddressHistory(account: Account, start: number, limit: number): Promise<any>;

  updateAccountAlianName(accountKey: string, newName: string): Promise<void>;
  updateKeyringAlianName(keyringKey: string, newName: string): Promise<void>;
  generatePrePrivateKey(keyringType: string): Promise<any>;

  getWIF(address: string): Promise<string>;
  assetsListsPage(): Promise<{
    assetsData: Array<UtxoAddressSumInfo & Partial<CoinNames>>;
    chainName: string;
    address: string;
    chainId: number;
  }>;
  getTransferAddressHistory(): Promise<transferAddressHistory[]>;
  updateTransferAddressesHistory(newAddress: string): Promise<void>;
  getTransferFees(
    tokenType: number,
    senderAddress: string,
    isAll: boolean,
    amount?: string,
    receivedAddress?: string
  ): Promise<number>;
  transfer(
    amount: string,
    tokenType: string,
    receivedAddress: string,
    senderAddress: string,
    crosschain: number,
    timeLimit: number
  ): Promise<any>;
  getStoredChainInfo(): Promise<{ [key: string]: ChainInfo }>;
  addchainInfo(chainType: string, chainInfo: ChainInfo): Promise<void>;
  getApproval(id: string): Promise<any>;
  resolveApproval(id: string, data: any): Promise<void>;
  rejectApproval(id: string): Promise<void>;

  clearCache(): Promise<void>;
}

const WalletContext = createContext<WalletController | null>(null);

export const WalletProvider = ({ children, wallet }: { children?: React.ReactNode; wallet: WalletController }) => {
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useWallet = () => {
  const wallet = useContext(WalletContext) as unknown as WalletController;
  if (!wallet) {
    throw new Error('Wallet not found');
  }
  return wallet;
};
