import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { DEFAULT_LOCKTIME_ID, NetworkType } from '@/shared/constants';
import { WalletConfig } from '@/shared/types';

export interface SettingsState {
  locale: string;
  networkType: NetworkType;
  walletConfig: WalletConfig;
  skippedVersion: string;
  autoLockTimeId: number;
  reset: () => void;
  updateSettings: (payload: {
    locale?: string;
    networkType?: NetworkType;
    walletConfig?: WalletConfig;
    skippedVersion?: string;
    autoLockTimeId?: number;
  }) => void;
}

const initialState = {
  locale: 'en',
  networkType: NetworkType.MAINNET,
  walletConfig: {
    version: '',
    endpoint: '',
  },
  skippedVersion: '',
  autoLockTimeId: DEFAULT_LOCKTIME_ID,
};

export const settingsStore = create<SettingsState>()(
  persist((set, get) => ({
    ...initialState,

    reset: () => set(initialState),

    updateSettings: (playload: {
      locale?: string;
      networkType?: NetworkType;
      walletConfig?: WalletConfig;
      skippedVersion?: string;
      autoLockTimeId?: number;
    }) => {
      set((state) => ({
        ...state,
        ...playload,
      }));
    },
  }),
  {
    name: 'settings-state',
    storage: createJSONStorage(() => localStorage),
  }
)
);
