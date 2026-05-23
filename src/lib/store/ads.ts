import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdState {
  // Modal frequency capping
  modalShownSession: boolean;
  modalShownTimestamps: number[];
  canShowModal: () => boolean;
  recordModalShown: () => void;
}

const MAX_MODAL_PER_DAY = 3;

export const useAdStore = create<AdState>()(
  persist(
    (set, get) => ({
      // Modal frequency capping
      modalShownSession: false,
      modalShownTimestamps: [],
      canShowModal: () => {
        const state = get();
        if (state.modalShownSession) return false;
        const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
        const recent = state.modalShownTimestamps.filter((t) => t > dayAgo);
        return recent.length < MAX_MODAL_PER_DAY;
      },
      recordModalShown: () =>
        set((state) => {
          const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
          const recent = state.modalShownTimestamps.filter((t) => t > dayAgo);
          return {
            modalShownSession: true,
            modalShownTimestamps: [...recent, Date.now()],
          };
        }),
    }),
    {
      name: "lv-ads",
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          sessionStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          sessionStorage.removeItem(name);
        },
      },
      partialize: (state) =>
        ({
          modalShownTimestamps: state.modalShownTimestamps,
        }) as unknown as AdState,
    },
  ),
);