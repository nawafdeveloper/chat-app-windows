import { create } from 'zustand';

type ActiveSubsidebarType =
    | 'new-contact'
    | 'new-group'
    | null;

interface SubsidebarState {
    activeSubsideBar: ActiveSubsidebarType;
    setActiveSubsideBar: (value: ActiveSubsidebarType) => void;
    resetSidebar: () => void;
}

export const useSubsidebarStore = create<SubsidebarState>((set) => ({
    activeSubsideBar: null,

    setActiveSubsideBar: (value) => set({ activeSubsideBar: value }),

    resetSidebar: () => set({ activeSubsideBar: null }),
}));