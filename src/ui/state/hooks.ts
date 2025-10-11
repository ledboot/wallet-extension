import { useCallback } from 'react';

import { useWallet } from '@/ui/utils/walletContext';

import { accountsStore } from './accounts';
import { globalStore } from './global';
import { keyringsStore } from './keyrings';
import { settingsStore } from './settings';

// Accounts hooks
export const useAccounts = () => accountsStore();
export const useCurrentAccount = () => accountsStore((state) => state.current);
export const useAccountsList = () => accountsStore((state) => state.accounts);
export const useBalanceMap = () => accountsStore((state) => state.balanceMap);
export const useHistoryMap = () => accountsStore((state) => state.historyMap);
export const useAddressSummary = () =>
  accountsStore((state) => state.addressSummary);

//Global hooks
export const useGlobal = () => globalStore();
export const useIsUnlocked = () => globalStore((state) => state.isUnlocked);
export const useIsReady = () => globalStore((state) => state.isReady);
export const useIsBooted = () => globalStore((state) => state.isBooted);

//Keyrings hooks
export const useKeyrings = () => keyringsStore();
export const useCurrentKeyring = () => keyringsStore((state) => state.current);
export const useKeyringsList = () => keyringsStore((state) => state.keyrings);

//s
export const useSettings = () => settingsStore();
export const useNetworkType = () => settingsStore((state) => state.networkType);
export const useChainType = () => settingsStore((state) => state.chainType);

export function useUnlockCallback() {
  const wallet = useWallet();
  return useCallback(
    async (password: string) => {
      await wallet.unlock(password);
      globalStore.getState().update({ isUnlocked: true });
      // 同步 keyrings 到本地状态
      const keyrings = await wallet.getKeyrings();
      keyringsStore.getState().setKeyrings(keyrings);
      if (keyrings && keyrings.length > 0) {
        keyringsStore.getState().setCurrent(keyrings[0]);
        accountsStore.getState().setCurrent(keyrings[0].accounts[0]);
      }
    },
    [wallet]
  );
}

export function useCreateWalletCallback() {
  const wallet = useWallet();
  return useCallback(
    async (privateKey: string, alianName?: string) => {
      await wallet.createKeyringWithPrivateKey(privateKey, alianName);
      globalStore.getState().update({ isUnlocked: true });
    },
    [wallet]
  );
}