import React, { useMemo } from 'react'
import CreateGroupMembersHeaderLargeSidebar from './create-group-members-header-large-sidebar';
import { Checkbox, CircularProgress, List, ListItem, ListItemAvatar, ListItemButton, ListItemText, Typography } from '@mui/material';
import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import DecryptedProfileImage from './decrypted-profile-image';
import { Person } from '@mui/icons-material';
import { useCryptoKeys } from '../context/crypto';
import { useGroupMembersSearchStore } from '../store/use-group-memeber-search-store';
import { useDecryptedContacts } from '../hooks/use-decrypted-contacts';
import { matchesContactSearch } from '../lib/contact-crypto';
import { groupContactsByLetter } from '../lib/contact-organizer';
import { isManagedProfileImageUrl } from '../lib/profile-image-url';
import { Contact } from '../types/contacts.type';
import { getContactDisplayName } from '../lib/contact-display';
import { useNewGroupStore } from '../store/use-new-group-store';

function getContactAvatarFallback(contact: Contact) {
    return (
        contact.contact_first_name?.[0] ||
        contact.contact_second_name?.[0] ||
        contact.contact_number[0] ||
        ""
    ).toUpperCase();
}

export default function CreateGroupMemebersListLargeSidebar() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const { isReady } = useCryptoKeys();
    const { toggleContact, isSelected } = useNewGroupStore();
    const { query } = useGroupMembersSearchStore();
    const { contacts, isLoading: isLoadingContacts, error: contactsError } =
        useDecryptedContacts();
    const filteredContacts = query.trim()
        ? contacts.filter((contact) => matchesContactSearch(contact, query))
        : contacts;
    const groupedContacts = groupContactsByLetter(filteredContacts);

    const avatarByContactId = useMemo(() => {
        const avatarMap = new Map<string, string>();

        for (const contact of contacts) {
            const contactAvatar =
                contact.contact_avatar &&
                    !isManagedProfileImageUrl(contact.contact_avatar)
                    ? contact.contact_avatar
                    : "";

            avatarMap.set(contact.contact_id, contactAvatar);

            avatarMap.set(
                contact.contact_id,
                contactAvatar
            );
        }

        return avatarMap;
    }, [contacts]);

    const handleContactSelect = (contact: Contact) => {
        toggleContact(contact);
    }

    return (
        <div
            className={`flex flex-col space-y-4 w-full bg-white dark:bg-[#161717] ${isRTL ? "border-l" : "border-r"
                } dark:border-neutral-700 border-neutral-300 overflow-y-auto pt-5`}
        >
            <div className="flex h-full flex-col gap-y-3">
                <CreateGroupMembersHeaderLargeSidebar />
                <div className="flex flex-col overflow-y-auto px-5">
                    {isLoadingContacts || !isReady ? (
                        <div className="flex items-center justify-center py-8">
                            <CircularProgress size={22} sx={{ color: "#25D366" }} />
                        </div>
                    ) : contactsError ? (
                        <Typography
                            sx={{
                                px: 2,
                                py: 3,
                                color: (theme) =>
                                    theme.palette.mode === "dark" ? "#d7d7d7" : "#555555",
                            }}
                        >
                            {contactsError}
                        </Typography>
                    ) : groupedContacts.length === 0 ? (
                        <Typography
                            sx={{
                                px: 2,
                                py: 3,
                                color: (theme) =>
                                    theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                            }}
                        >
                            {query.trim()
                                ? isRTL
                                    ? "لا توجد نتائج مطابقة."
                                    : "No matching contacts found."
                                : isRTL
                                    ? "لا توجد جهات اتصال بعد."
                                    : "No contacts yet."}
                        </Typography>
                    ) : (
                        <List>
                            {groupedContacts.map((group) => (
                                <div key={group.letter}>
                                    <Typography
                                        sx={{
                                            px: 2,
                                            py: 0.5,
                                            paddingY: 4,
                                            fontWeight: 600,
                                            color: (theme) =>
                                                theme.palette.mode === "dark"
                                                    ? "#A5A5A5"
                                                    : "#636261",
                                            fontSize: 14,
                                        }}
                                    >
                                        {group.letter}
                                    </Typography>
                                    {group.contacts.map((contact) => {
                                        const avatarSrc =
                                            avatarByContactId.get(contact.contact_id) ?? "";
                                        const selected = isSelected(contact.contact_id);
                                        const canAddToEncryptedGroup = Boolean(
                                            contact.linked_user_id &&
                                                contact.linked_user_public_key
                                        );

                                        return (
                                            <ListItemButton
                                                component="button"
                                                type="button"
                                                key={contact.contact_id}
                                                onClick={() => handleContactSelect(contact)}
                                                disabled={!canAddToEncryptedGroup}
                                                sx={(theme) => ({
                                                    width: "100%",
                                                    borderRadius: 3,
                                                    padding: 0,
                                                    marginY: "2px",
                                                    backgroundColor: "transparent",
                                                    textTransform: "inherit",
                                                    color:
                                                        theme.palette.mode === "dark"
                                                            ? "#ffffff"
                                                            : "#000000",
                                                    "&:hover": {
                                                        backgroundColor:
                                                            theme.palette.mode === "dark"
                                                                ? "#242626"
                                                                : "#f7f5f3",
                                                    },
                                                })}
                                            >
                                                <ListItem sx={{ paddingY: 1, paddingX: 2 }}>
                                                    <ListItemAvatar>
                                                        <DecryptedProfileImage
                                                            imageUrl={avatarSrc}
                                                            fallback={
                                                                getContactAvatarFallback(contact) || (
                                                                    <Person />
                                                                )
                                                            }
                                                            sx={(theme) => ({
                                                                width: 50,
                                                                height: 50,
                                                                marginRight: 2,
                                                                backgroundColor: "#25D366",
                                                                color:
                                                                    theme.palette.mode === "dark"
                                                                        ? "#1C1E21"
                                                                        : "#FFFFFF",
                                                            })}
                                                        />
                                                    </ListItemAvatar>
                                                    <ListItemText
                                                        primary={getContactDisplayName(contact)}
                                                        secondary={
                                                            canAddToEncryptedGroup
                                                                ? contact.contact_number
                                                                : isRTL
                                                                  ? "ط§ظ„طھط´ظپظٹط± ط؛ظٹط± ط¬ط§ظ‡ط²"
                                                                  : "Encryption not ready"
                                                        }
                                                    />
                                                    <Checkbox
                                                        checked={selected}
                                                        disableRipple
                                                        tabIndex={-1}
                                                        sx={{
                                                            pointerEvents: "none",
                                                            color: "#A5A5A5",
                                                            "&.Mui-checked": {
                                                                color: "#25D366",
                                                            },
                                                            "& .MuiSvgIcon-root": {
                                                                fontSize: 22,
                                                            },
                                                        }}
                                                    />
                                                </ListItem>
                                            </ListItemButton>
                                        );
                                    })}
                                </div>
                            ))}
                        </List>
                    )}
                </div>
            </div>
        </div>
    )
}
