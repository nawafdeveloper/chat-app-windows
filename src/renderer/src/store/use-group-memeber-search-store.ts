import { create } from 'zustand';

type GroupMembersSearchStore = {
    query: string;
    setQuery: (query: string) => void;
    clearQuery: () => void;
};

export const useGroupMembersSearchStore = create<GroupMembersSearchStore>((set) => ({
    query: '',
    setQuery: (query) => set({ query }),
    clearQuery: () => set({ query: '' }),
}));