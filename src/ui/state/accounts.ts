import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import {
  Account,
  AddressSummary,
  AnexBalance,
  TxHistoryItem,
} from '../../shared/types';

export interface AccountsState {
  accounts: Account[];
  current: Account;
  loading: boolean;
  balanceMap: {
    [key: string]: AnexBalance;
  };
  historyMap: {
    [key: string]: {
      list: TxHistoryItem[];
      expired: boolean;
    };
  };
  addressSummary: AddressSummary;
  setCurrent: (payload: Account) => void;
  setAccounts: (payload: Account[]) => void;
  setBalance: (payload: { [key: string]: AnexBalance }) => void;
  setHistory: (payload: {
    [key: string]: { list: TxHistoryItem[]; expired: boolean };
  }) => void;
  setAddressSummary: (payload: AddressSummary) => void;
  setCurrentAccountName: (payload: string) => void;
  setCurrentAddressFlag: (payload: number) => void;
  updateAccountName: (payload: Account) => void;
  reset: () => void;
}

const initialAccount = {
  type: '',
  pubkey: '',
  address: '',
  alianName: '',
  index: 0,
  balance: 0,
  key: '',
  flag: 0,
};

const initialState = {
  accounts: [],
  current: initialAccount,
  loading: false,
  balanceMap: {},
  historyMap: {},
  addressSummary: {
    address: '',
    totalSatoshis: 0,
    btcSatoshis: 0,
    assetSatoshis: 0,
  },
};

export const accountsStore = create<AccountsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      pendingLogin: () => {
        set({
          loading: true,
        });
      },
      rejectLogin: () => {
        set({
          loading: false,
        });
      },

      reset: () => set(initialState),

      setCurrent: (payload: Account) =>
        set({ current: payload || initialAccount }),

      setAccounts: (payload: Account[]) => set({ accounts: payload || [] }),

      setBalance: (payload: { [key: string]: AnexBalance }) =>
        set({ balanceMap: payload || {} }),

      setHistory: (payload: {
        [key: string]: { list: TxHistoryItem[]; expired: boolean };
      }) => set({ historyMap: payload || {} }),

      setAddressSummary: (payload: AddressSummary) =>
        set({ addressSummary: payload }),

      setCurrentAccountName: (payload: string) => {
        set((state) => {
          const updatedCurrent = { ...state.current, alianName: payload };
          const updatedAccounts = state.accounts.map((account) =>
            account.address === updatedCurrent.address
              ? { ...account, alianName: payload }
              : account
          );
          return {
            current: updatedCurrent,
            accounts: updatedAccounts,
          };
        });
      },

      setCurrentAddressFlag: (payload: number) => {
        set((state) => {
          const updatedCurrent = { ...state.current, flag: payload };
          const updatedAccounts = state.accounts.map((account) =>
            account.address === updatedCurrent.address
              ? { ...account, flag: payload }
              : account
          );
          return {
            current: updatedCurrent,
            accounts: updatedAccounts,
          };
        });
      },

      updateAccountName: (payload: Account) => {
        const account = payload;
        set((state) => {
          const updatedCurrent =
            state.current.key == account.key
              ? { ...state.current, alianName: account.alianName }
              : state.current;
          const updateAccounts = state.accounts.map((item) =>
            item.key == account.key
              ? { ...item, alianName: account.alianName }
              : item
          );
          return {
            current: updatedCurrent,
            accounts: updateAccounts,
          };
        });
      },
    }),
    {
      name: 'accounts-state',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
