import { create } from 'zustand';

type ActiveSidebarType =
    | 'main-chat'
    | 'search-chat'
    | 'create-chat'
    | 'main-setting'
    | 'main-archive';

interface SidebarState {
    activeSideBar: ActiveSidebarType;
    setActiveSideBar: (value: ActiveSidebarType) => void;
    resetSidebar: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
    activeSideBar: 'main-chat',

    setActiveSideBar: (value) => set({ activeSideBar: value }),

    resetSidebar: () => set({ activeSideBar: 'main-chat' }),
}));