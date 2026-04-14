import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { StaffUser } from "@workspace/api-client-react";

interface PosState {
  language: "en" | "es";
  setLanguage: (lang: "en" | "es") => void;

  activeStaff: StaffUser | null;
  setActiveStaff: (staff: StaffUser | null) => void;

  displayCurrency: "MXN" | "USD" | "CAD";
  setDisplayCurrency: (currency: "MXN" | "USD" | "CAD") => void;

  isLocked: boolean;
  setIsLocked: (locked: boolean) => void;
}

export const usePosStore = create<PosState>()(
  persist(
    (set) => ({
      language: "en",
      setLanguage: (language) => set({ language }),

      activeStaff: null,
      setActiveStaff: (activeStaff) => set({ activeStaff }),

      displayCurrency: "MXN",
      setDisplayCurrency: (displayCurrency) => set({ displayCurrency }),

      isLocked: false,
      setIsLocked: (isLocked) => set({ isLocked }),
    }),
    {
      name: "gusto-pos-storage",
      partialize: (state) => ({
        language: state.language,
        displayCurrency: state.displayCurrency,
        activeStaff: state.activeStaff,
        // isLocked is NOT persisted to prevent lockout issues across sessions
      }),
    },
  ),
);
