import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AdState {
  dismissedIds: string[];
  dismiss: (id: string) => void;
  isDismissed: (id: string) => boolean;

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
      dismissedIds: [],
      dismiss: (id: string) =>
        set((state) => ({
          dismissedIds: state.dismissedIds.includes(id)
            ? state.dismissedIds
            : [...state.dismissedIds, id],
        })),
      isDismissed: (id: string) => get().dismissedIds.includes(id),

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
      // Use sessionStorage so dismissed ads and modal caps reset on new sessions
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
      // Only persist these fields to sessionStorage; modalShownSession resets each session
      partialize: (state) =>
        ({
          dismissedIds: state.dismissedIds,
          modalShownTimestamps: state.modalShownTimestamps,
        }) as unknown as AdState,
    },
  ),
);