import { create } from "zustand";

interface GroupSidebarState {
    groupSidebarState: boolean;
    setGroupSidebarState: (value: boolean) => void;
}

export const useGroupSidebarStore = create<GroupSidebarState>((set) => ({
    groupSidebarState: false,
    setGroupSidebarState: (value) => set({ groupSidebarState: value })
}));