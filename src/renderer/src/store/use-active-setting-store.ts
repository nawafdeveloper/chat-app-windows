import { create } from 'zustand';

export type SettingsSection =
    | 'settings-main'
    | 'settings-general'
    | 'settings-profile'
    | 'settings-account'
    | 'settings-privacy'
    | 'settings-chats'
    | 'settings-notifications'
    | 'settings-help';

export type SettingsSubsection =
    | 'last-seen'
    | 'profile-seen'
    | 'about-seen'
    | 'status-seen'
    | 'messages-disappear'
    | 'blocked-contacts'
    | 'close-app'
    | 'chat-theme'
    | 'chat-wallpaper'
    | 'media-quality-upload'
    | 'media-auto-download'
    | 'messages-notifications'
    | 'groups-notifications'
    | null;

interface SettingsStore {
    activeSettingsSection: SettingsSection;
    setActiveSettingsSection: (section: SettingsSection) => void;
    navigateToSettings: (href: string) => void;
    activeSettingsSubsection: SettingsSubsection;
    setActiveSettingsSubsection: (subsection: SettingsSubsection) => void;
    navigateToSettingsSubsection: (href: string) => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
    activeSettingsSection: 'settings-main',
    activeSettingsSubsection: null,

    setActiveSettingsSection: (section) => set({ activeSettingsSection: section }),
    setActiveSettingsSubsection: (section) => set({activeSettingsSubsection: section}),

    navigateToSettings: (href) => {
        const section = href as SettingsSection;
        set({ activeSettingsSection: section });
    },
    navigateToSettingsSubsection: (href) => {
        const section = href as SettingsSubsection;
        set({ activeSettingsSubsection: section });
    }
}));