import { create } from 'zustand';

type WallpaperState = {
    selectedKey: string | null;
    previewKey: string | null;
    isSaving: boolean;

    setSelected: (key: string) => void;
    setPreview: (key: string | null) => void;
    setSaving: (val: boolean) => void;

    getActiveKey: () => string | null;
};

export const useWallpaperStore = create<WallpaperState>((set, get) => ({
    selectedKey: null,
    previewKey: null,
    isSaving: false,

    setSelected: (key) => set({ selectedKey: key }),
    setPreview: (key) => set({ previewKey: key }),
    setSaving: (val) => set({ isSaving: val }),

    getActiveKey: () => {
        const { previewKey, selectedKey } = get();
        return previewKey ?? selectedKey;
    },
}));