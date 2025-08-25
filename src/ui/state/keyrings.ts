import { Account, WalletKeyring } from '@shared/types';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import eventBus from '@/shared/eventBus';
import { EVENTS } from '@/shared/constants';

export interface KeyringsState {
  keyrings: WalletKeyring[];
  current: WalletKeyring;
  __listener?: (payload?: any) => void;
  reset: () => void;
  setCurrent: (payload: WalletKeyring) => void;
  setKeyrings: (payload: WalletKeyring[]) => void;
  updateKeyringName: (payload: WalletKeyring) => void;
  updateAccountName: (payload: Account) => void;
  startSync: (fetchKeyrings: () => Promise<WalletKeyring[]>) => void;
  stopSync: () => void;
}

const initialKeyring: WalletKeyring = {
  key: '',
  index: 0,
  type: '',
  accounts: [],
  alianName: '',
};

const initialState = {
  keyrings: [],
  current: initialKeyring,
};

export const keyringsStore = create<KeyringsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      reset: () => set(initialState),

      setCurrent: (payload: WalletKeyring) => set({ current: payload || initialKeyring }),

      setKeyrings: (payload: WalletKeyring[]) => set({ keyrings: payload }),

      updateKeyringName: (payload: WalletKeyring) => {
        const keyring = payload;
        set((state) => {
          const updatedCurrent = state.current.key === keyring.key
            ? { ...state.current, alianName: keyring.alianName }
            : state.current;
          
          const updatedKeyrings = state.keyrings.map((v) =>
            v.key === keyring.key ? { ...v, alianName: keyring.alianName } : v
          );

          return {
            current: updatedCurrent,
            keyrings: updatedKeyrings
          };
        });
      },

      updateAccountName: (payload: Account) => {
        const account = payload;
        set((state) => {
          const updatedCurrent = {
            ...state.current,
            accounts: state.current.accounts.map((v) =>
              v.key === account.key ? { ...v, alianName: account.alianName } : v
            )
          };

          const updatedKeyrings = state.keyrings.map((v) => ({
            ...v,
            accounts: v.accounts.map((w) =>
              w.key === account.key ? { ...w, alianName: account.alianName } : w
            )
          }));

          return {
            current: updatedCurrent,
            keyrings: updatedKeyrings
          };
        });
      },

      startSync: (fetchKeyrings: () => Promise<WalletKeyring[]>) => {
        const listener = async (payload?: any) => {
          if (payload?.method === 'updateKeyrings') {
            console.log('keyringsStore received updateKeyrings event');
            const keyrings = await fetchKeyrings();
            set({ keyrings });
            if (keyrings && keyrings.length > 0) {
              set({ current: keyrings[0] });
            }
          }
        };
        // 保存到 state 以便 stop 时移除
        set((state) => ({ ...state, __listener: listener }));
        // 监听 eventBus 的广播事件
        eventBus.addEventListener(EVENTS.broadcastToUI, listener);
      },

      stopSync: () => {
        const currentListener = get().__listener;
        if (currentListener) {
          // 移除 eventBus 监听
          eventBus.removeEventListener(EVENTS.broadcastToUI, currentListener);
          set((state) => ({ ...state, __listener: undefined }));
        }
      },
    }),
    {
      name: 'keyrings-state',
      storage: createJSONStorage(() => localStorage),
    }
  )
);