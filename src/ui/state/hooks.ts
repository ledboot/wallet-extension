import { accountsStore } from './accounts';
import { globalStore } from './global';
import { AssetItem, keyringsStore } from './keyrings';
import { settingsStore } from './settings';

// 模块级稳定空展平量，避免 selector 每次返回新对象导致 Zustand 无限重渲染
const EMPTY_ASSETS: AssetItem[] = [];
const EMPTY_STRING = '';

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
export const useAssetsLoading = () =>
  keyringsStore((state) => state.assetsLoading);

/**
 * 获取当前账户在当前链的资产列表（address + chainId 索引）。
 * 切换账户或网络后自动返回对应数据，无需额外刷新。
 */
export const useCurrentAssets = (address: string, chainId: number) =>
  keyringsStore(
    (state) => state.assetsMap[`${address}:${chainId}`] ?? EMPTY_ASSETS
  );

export const useCurrentChainName = (address: string, chainId: number) =>
  keyringsStore(
    (state) => state.chainNameMap[`${address}:${chainId}`] ?? EMPTY_STRING
  );

//s
export const useSettings = () => settingsStore();
export const useNetworkType = () => settingsStore((state) => state.networkType);
export const useChainType = () => settingsStore((state) => state.chainType);
