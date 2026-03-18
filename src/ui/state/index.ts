import { create } from 'zustand';

import { accountsStore } from './accounts';
import { globalStore } from './global';
import { keyringsStore } from './keyrings';
import { settingsStore } from './settings';

export type AppState = {
  accounts: ReturnType<typeof accountsStore.getState>;
  global: ReturnType<typeof globalStore.getState>;
  keyrings: ReturnType<typeof keyringsStore.getState>;
  settings: ReturnType<typeof settingsStore.getState>;
};

export const useRootStore = create<AppState>()(() => ({
  accounts: accountsStore.getState(),
  global: globalStore.getState(),
  keyrings: keyringsStore.getState(),
  settings: settingsStore.getState(),
}));
