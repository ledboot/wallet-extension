import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface GlobalState {
  isUnlocked: boolean;
  isReady: boolean;
  isBooted: boolean;
  reset: () => void;
  update: (payload: {
    isUnlocked?: boolean;
    isReady?: boolean;
    isBooted?: boolean;
  }) => void;
}

const initialState = {
  isUnlocked: false,
  isReady: false,
  isBooted: false,
};

export const globalStore = create<GlobalState>()(
  persist(
    (set) => ({
      ...initialState,

      reset: () => set(initialState),

      update: (playload:{
        isUnlocked?: boolean;
        isReady?: boolean;
        isBooted?: boolean;
      }) => {
        set((state) => ({
          ...state,
          ...playload,
        }));
      },
    }),
    {
      name: 'global-state',
      storage: createJSONStorage(() => localStorage),
    }
  )
);