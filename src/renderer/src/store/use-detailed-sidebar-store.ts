import { create } from 'zustand';

export type DetailedSidebarTarget =
    | {
          type: "chat";
          chatId: string;
      }
    | {
          type: "user";
          chatId: string;
          userId: string;
      };

interface DetailedSidebarState {
    isOpen: boolean;
    target: DetailedSidebarTarget | null;
    open: (target?: DetailedSidebarTarget | null) => void;
    close: () => void;
    toggle: () => void;
    setOpen: (value: boolean) => void;
    setTarget: (target: DetailedSidebarTarget | null) => void;
}

export const useDetailedSidebarStore = create<DetailedSidebarState>((set) => ({
    isOpen: false,
    target: null,

    open: (target) =>
        set((state) => ({
            isOpen: true,
            target: target === undefined ? state.target : target,
        })),
    close: () => set({ isOpen: false }),
    toggle: () => set((state) => ({ isOpen: !state.isOpen })),
    setOpen: (value) => set({ isOpen: value }),
    setTarget: (target) => set({ target }),
}));
