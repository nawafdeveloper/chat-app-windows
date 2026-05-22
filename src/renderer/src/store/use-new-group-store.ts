import { Contact } from '../types/contacts.type';
import { create } from 'zustand';

type NewGroupStore = {
    selectedContacts: Contact[];
    groupName: string;
    groupAvatar: string | null;
    groupAvatarFile: File | null;
    groupAdmins: string[]; // contact_ids

    toggleContact: (contact: Contact) => void;
    isSelected: (contact_id: string) => boolean;
    clearSelectedContacts: () => void;

    setGroupName: (name: string) => void;
    setGroupAvatar: (uri: string | null, file?: File | null) => void;

    toggleAdmin: (contact_id: string) => void;
    isAdmin: (contact_id: string) => boolean;

    resetStore: () => void;
};

const initialState = {
    selectedContacts: [],
    groupName: '',
    groupAvatar: null,
    groupAvatarFile: null,
    groupAdmins: [],
};

export const useNewGroupStore = create<NewGroupStore>((set, get) => ({
    ...initialState,

    toggleContact: (contact) => {
        const { selectedContacts } = get();
        const exists = selectedContacts.some((c) => c.contact_id === contact.contact_id);
        set({
            selectedContacts: exists
                ? selectedContacts.filter((c) => c.contact_id !== contact.contact_id)
                : [...selectedContacts, contact],
        });
    },

    isSelected: (contact_id) =>
        get().selectedContacts.some((c) => c.contact_id === contact_id),

    clearSelectedContacts: () => set({ selectedContacts: [], groupAdmins: [] }),

    setGroupName: (name) => set({ groupName: name }),

    setGroupAvatar: (uri, file = null) =>
        set({ groupAvatar: uri, groupAvatarFile: file }),

    toggleAdmin: (contact_id) => {
        const { groupAdmins, selectedContacts } = get();
        const isSelected = selectedContacts.some((c) => c.contact_id === contact_id);
        if (!isSelected) return;

        const isAlreadyAdmin = groupAdmins.includes(contact_id);
        set({
            groupAdmins: isAlreadyAdmin
                ? groupAdmins.filter((id) => id !== contact_id)
                : [...groupAdmins, contact_id],
        });
    },

    isAdmin: (contact_id) => get().groupAdmins.includes(contact_id),

    resetStore: () => set(initialState),
}));
