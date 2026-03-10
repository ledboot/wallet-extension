import { Account, CoinNames, UtxoAddressSumInfo, WalletKeyring } from '@shared/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// 资产条目 = UTXO 聚合 + 可选的 CoinNames 元数据 + 链标签
export type AssetItem = UtxoAddressSumInfo & Partial<CoinNames> & { chainLabel?: string };

// 资产索引键：`${address}:${chainId}`
type AssetKey = string;
const makeAssetKey = (address: string, chainId: number): AssetKey => `${address}:${chainId}`;

export interface AssetsSlice {
  // address:chainId → 该账户在该链的资产列表
  assetsMap: Record<AssetKey, AssetItem[]>;
  // address:chainId → 该链的显示名称
  chainNameMap: Record<AssetKey, string>;
  assetsLoading: boolean;
  currentAddress: string;
  currentChainId: number;
  setCurrentAssets: (address: string, chainId: number, assets: AssetItem[], chainName: string) => void;
  setAssetsLoading: (loading: boolean) => void;
  clearAssets: () => void;
}

export interface KeyringsState extends AssetsSlice {
  keyrings: WalletKeyring[];
  current: WalletKeyring;
  reset: () => void;
  setCurrent: (payload: WalletKeyring) => void;
  setKeyrings: (payload: WalletKeyring[]) => void;
  updateKeyringName: (payload: WalletKeyring) => void;
  updateAccountName: (payload: Account) => void;
}

const initialKeyring: WalletKeyring = {
  key: '',
  index: 0,
  type: '',
  accounts: [],
  alianName: '',
};

const initialState = {
  keyrings: [] as WalletKeyring[],
  current: initialKeyring,
  assetsMap: {} as Record<AssetKey, AssetItem[]>,
  chainNameMap: {} as Record<AssetKey, string>,
  assetsLoading: true,
  currentAddress: '',
  currentChainId: 0,
};

export const keyringsStore = create<KeyringsState>()(
  persist(
    (set) => ({
      ...initialState,

      reset: () => set(initialState),

      setCurrent: (payload: WalletKeyring) => set({ current: payload || initialKeyring }),

      setKeyrings: (payload: WalletKeyring[]) => set({ keyrings: payload }),

      updateKeyringName: (payload: WalletKeyring) => {
        const keyring = payload;
        set((state) => {
          const updatedCurrent =
            state.current.key === keyring.key ? { ...state.current, alianName: keyring.alianName } : state.current;

          const updatedKeyrings = state.keyrings.map((v) =>
            v.key === keyring.key ? { ...v, alianName: keyring.alianName } : v
          );

          return { current: updatedCurrent, keyrings: updatedKeyrings };
        });
      },

      updateAccountName: (payload: Account) => {
        const account = payload;
        set((state) => {
          const updatedCurrent = {
            ...state.current,
            accounts: state.current.accounts.map((v) =>
              v.key === account.key ? { ...v, alianName: account.alianName } : v
            ),
          };

          const updatedKeyrings = state.keyrings.map((v) => ({
            ...v,
            accounts: v.accounts.map((w) => (w.key === account.key ? { ...w, alianName: account.alianName } : w)),
          }));

          return { current: updatedCurrent, keyrings: updatedKeyrings };
        });
      },

      // ── 资产相关 ──────────────────────────────────────────────
      setCurrentAssets: (address, chainId, assets, chainName) => {
        const key = makeAssetKey(address, chainId);
        set((state) => ({
          assetsMap: { ...state.assetsMap, [key]: assets },
          chainNameMap: { ...state.chainNameMap, [key]: chainName },
          currentAddress: address,
          currentChainId: chainId,
          assetsLoading: false,
        }));
      },

      setAssetsLoading: (loading) => set({ assetsLoading: loading }),

      clearAssets: () =>
        set({
          assetsMap: {},
          chainNameMap: {},
          assetsLoading: true,
          currentAddress: '',
          currentChainId: 0,
        }),
    }),
    {
      name: 'keyrings-state',
      storage: createJSONStorage(() => localStorage),
      // 不持久化 loading 状态与原始资产数据（由 background 驱动）
      partialize: (state) => ({
        keyrings: state.keyrings,
        current: state.current,
      }),
    }
  )
);

/** 根据当前账户地址 + chainId 选取对应资产列表 */
export const selectCurrentAssets =
  (address: string, chainId: number): ((state: KeyringsState) => AssetItem[]) =>
  (state) =>
    state.assetsMap[makeAssetKey(address, chainId)] ?? [];

export const selectCurrentChainName =
  (address: string, chainId: number): ((state: KeyringsState) => string) =>
  (state) =>
    state.chainNameMap[makeAssetKey(address, chainId)] ?? '';

export { makeAssetKey };
