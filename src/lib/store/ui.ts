import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  fontSize: number; // -1 smaller, 0 default, 1 larger, 2 extra-large
  setFontSize: (size: number) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      fontSize: 0,
      setFontSize: (size: number) => set({ fontSize: size }),
    }),
    { name: "lv-ui" },
  ),
);