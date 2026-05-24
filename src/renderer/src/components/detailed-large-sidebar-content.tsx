import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import {
    AddAPhoto,
    AddComment,
    BlockOutlined,
    Check,
    CloseOutlined,
    CollectionsOutlined,
    DeleteOutlineOutlined,
    EditOutlined,
    ExpandMoreOutlined,
    Group,
    LogoutOutlined,
    NotificationsOutlined,
    Person,
    PersonAdd,
    PersonAddOutlined,
    SearchOutlined,
} from '@mui/icons-material';
import {
    Alert,
    Box,
    Checkbox,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemAvatar,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Menu,
    MenuItem,
    Stack,
    Switch,
    TextField,
    Typography,
    Button,
    CircularProgress,
} from '@mui/material';
import React, { useEffect, useMemo, useRef, useState } from 'react'
import DecryptedProfileImage from './decrypted-profile-image';
import { useMediaDisplayAllStore } from '../store/use-media-display-all-store';
import { DetailedSidebarMediaItem, DetailedSidebarMediaTile } from './detailed-sidebar-item-media';
import { useToggleChatNotifications } from '../hooks/use-toggle-chat-notifications';
import { uploadEncryptedMessageMedia } from '../lib/message-media-upload';
import { encryptTextForRecipients } from '../lib/chat-e2ee';
import { findContactByUserId, getContactDisplayName } from '../lib/contact-display';
import { normalizeChatItem } from '../lib/chat-utils';
import { useActiveChatStore } from '../store/use-active-chat-store';
import { useDetailedSidebarStore } from '../store/use-detailed-sidebar-store';
import { useChatMenuActions } from '../hooks/use-chat-menu-actions';
import type { ChatGroupMember, ChatItemType } from '../types/chats.type';
import type { Contact } from '../types/contacts.type';
import { authClient } from '../lib/auth-client';
import { useSidebarStore } from '../store/use-active-sidebar-store';
import { useSubsidebarStore } from '../store/use-active-subsidebar-store';
import { useRightSideContactCreateStore } from '../store/use-right-side-contact-create-store';
import { splitPhoneNumber } from '../utils/split-phone-number';
import { encryptContactPayload } from '../lib/contact-crypto';
import { electronApiFetch } from '../lib/electron-api-fetch';
import { useCryptoKeys } from '../context/crypto';

type RawChatItem = Omit<ChatItemType, "created_at" | "updated_at"> & {
    created_at: string | Date;
    updated_at: string | Date;
};

type Props = {
    chatId: string | null;
    chatType: ChatItemType["chat_type"] | null;
    avatar?: string | null;
    contactName: string | null;
    contactNumber: string | null;
    biography?: string | null;
    mediaCount: number;
    mediaItems: DetailedSidebarMediaItem[];
    muteNotification: boolean;
    isBlocked: boolean;
    groupMembers?: ChatGroupMember[] | null;
    currentUserId?: string | null;
    contacts: Contact[];
    contact: Contact | null;
    messageContact?: Contact | null;
}

const EMPTY_GROUP_MEMBERS: ChatGroupMember[] = [];

function getMemberDisplayName(member: ChatGroupMember, contacts: Contact[]) {
    const contact = findContactByUserId(contacts, member.user_id);
    return contact ? getContactDisplayName(contact) : member.name || member.phone_number || member.user_id;
}

function getMemberAvatar(member: ChatGroupMember, contacts: Contact[]) {
    return findContactByUserId(contacts, member.user_id)?.contact_avatar ?? "";
}

function splitFullName(fullName?: string | null) {
    const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
    const firstName = parts.shift() ?? "";

    return {
        firstName,
        lastName: parts.join(" "),
    };
}

export default function DetailedLargeSidebarContent({
    chatId,
    chatType,
    avatar,
    contactName,
    contactNumber,
    biography,
    mediaCount,
    mediaItems,
    muteNotification,
    isBlocked,
    groupMembers: rawGroupMembers = [],
    currentUserId,
    contacts,
    contact,
    messageContact = contact,
}: Props) {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const { data: session } = authClient.useSession();
    const { isReady: areCryptoKeysReady } = useCryptoKeys();
    const { open } = useMediaDisplayAllStore();
    const closeDetails = useDetailedSidebarStore((state) => state.close);
    const upsertChat = useActiveChatStore((state) => state.upsertChat);
    const removeChat = useActiveChatStore((state) => state.removeChat);
    const setSelectedChatId = useActiveChatStore((state) => state.setSelectedChatId);
    const setRecipientPhone = useActiveChatStore((state) => state.setRecipientPhone);
    const setActiveSideBar = useSidebarStore((state) => state.setActiveSideBar);
    const setActiveSubsideBar = useSubsidebarStore((state) => state.setActiveSubsideBar);
    const { isToggling, setChatNotificationsMuted } = useToggleChatNotifications();
    const {
        isUpdating: isChatActionUpdating,
        setChatPreference,
        deleteChatForCurrentUser,
    } = useChatMenuActions();
    const openDirectContactChat = useActiveChatStore(
        (state) => state.openDirectContactChat
    );
    const {
        setIsRightSideContactCreateActive,
        setFirstName,
        setLastName,
        setDialCode,
        setPhoneNumber,
    } = useRightSideContactCreateStore();
    const selectedChatId = useActiveChatStore((state) => state.selectedChatId);
    const currentPhone = (session?.user as { phoneNumber?: string | null } | undefined)
        ?.phoneNumber ?? null;

    const [isMuted, setIsMuted] = useState(muteNotification || false);
    const [value, setValue] = useState("");
    const [isEditingName, setIsEditingName] = useState(false);
    const [groupNameDraft, setGroupNameDraft] = useState(contactName ?? "");
    const [isEditingContactName, setIsEditingContactName] = useState(false);
    const [contactNameDraft, setContactNameDraft] = useState(contactName ?? "");
    const [pendingAction, setPendingAction] = useState<string | null>(null);
    const [groupError, setGroupError] = useState<string | null>(null);
    const [memberMenuAnchor, setMemberMenuAnchor] = useState<HTMLElement | null>(null);
    const [activeMember, setActiveMember] = useState<ChatGroupMember | null>(null);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteSearchQuery, setInviteSearchQuery] = useState("");
    const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [selectedInviteIds, setSelectedInviteIds] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const inviteInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const isGroup = chatType === "group";
    const groupMembers = rawGroupMembers ?? EMPTY_GROUP_MEMBERS;
    const currentMember = groupMembers.find((member) => member.user_id === currentUserId);
    const isCurrentUserAdmin = Boolean(isGroup && currentMember?.is_admin);
    const isSavedSingleContact = Boolean(!isGroup && contact?.contact_id);
    const canAddSingleContact = Boolean(
        !isGroup &&
        !contact &&
        (messageContact?.contact_number || contactNumber)
    );
    const displayContactName =
        contactName?.trim() ||
        contactNumber ||
        (isRTL ? "جهة الإتصال" : "contact");
    const groupMemberIds = useMemo(
        () => new Set(groupMembers.map((member) => member.user_id)),
        [groupMembers]
    );
    const inviteCandidates = useMemo(
        () =>
            contacts.filter(
                (contact) =>
                    contact.linked_user_id &&
                    contact.linked_user_public_key &&
                    !groupMemberIds.has(contact.linked_user_id)
            ),
        [contacts, groupMemberIds]
    );
    const visibleInviteCandidates = useMemo(() => {
        const query = inviteSearchQuery.trim().toLowerCase();

        if (!query) {
            return inviteCandidates;
        }

        return inviteCandidates.filter((contact) =>
            [getContactDisplayName(contact), contact.contact_number]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(query))
        );
    }, [inviteCandidates, inviteSearchQuery]);
    const inviteLabelByUserId = useMemo(
        () =>
            new Map(
                inviteCandidates
                    .filter((contact) => contact.linked_user_id)
                    .map((contact) => [
                        contact.linked_user_id!,
                        getContactDisplayName(contact),
                    ])
            ),
        [inviteCandidates]
    );
    const selectedInviteLabels = selectedInviteIds.map(
        (userId) => inviteLabelByUserId.get(userId) ?? userId
    );

    const handleClear = () => {
        setValue("");
        inputRef.current?.blur();
    };

    const handleInviteSearchClear = () => {
        setInviteSearchQuery("");
        inviteInputRef.current?.blur();
    };

    useEffect(() => {
        setIsMuted(muteNotification || false);
    }, [muteNotification]);

    useEffect(() => {
        setGroupNameDraft(contactName ?? "");
        setContactNameDraft(contactName ?? "");
    }, [contactName]);

    const mergeUpdatedChat = (rawChat: RawChatItem) => {
        const normalized = normalizeChatItem(rawChat);
        const existing = useActiveChatStore
            .getState()
            .chats.find((chat) => chat.chat_id === normalized.chat_id);

        upsertChat({
            ...existing,
            ...normalized,
            last_message_context:
                normalized.last_message_context ||
                existing?.last_message_context ||
                "",
        });
    };

    const handleToggleNotifications = async () => {
        if (!chatId || isToggling) {
            return;
        }

        const nextMuted = !isMuted;
        setIsMuted(nextMuted);
        const didSave = await setChatNotificationsMuted(chatId, nextMuted);

        if (!didSave) {
            setIsMuted(!nextMuted);
        }
    };

    const handleSaveGroupName = async () => {
        if (!chatId || !isCurrentUserAdmin || !groupNameDraft.trim()) {
            return;
        }

        setPendingAction("name");
        setGroupError(null);

        try {
            const response = await fetch(`https://halabakk-web.nawaf-alhasosah.workers.dev/api/chats/${encodeURIComponent(chatId)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ displayName: groupNameDraft.trim() }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null) as { error?: string } | null;
                throw new Error(payload?.error ?? "Failed to update group name.");
            }

            const payload = await response.json() as { chat: RawChatItem };
            mergeUpdatedChat(payload.chat);
            setIsEditingName(false);
        } catch (error) {
            setGroupError(error instanceof Error ? error.message : "Failed to update group name.");
        } finally {
            setPendingAction(null);
        }
    };

    const handleSaveContactName = async () => {
        if (!contact?.contact_id || !contactNameDraft.trim()) {
            return;
        }

        if (!areCryptoKeysReady) {
            setGroupError("Unlock your encryption keys before saving a contact.");
            return;
        }

        const { firstName, lastName } = splitFullName(contactNameDraft);

        if (!firstName) {
            return;
        }

        setPendingAction("contact-name");
        setGroupError(null);

        try {
            const encryptedContact = await encryptContactPayload({
                contact_first_name: firstName,
                contact_second_name: lastName || undefined,
                contact_number:
                    contact.contact_number ||
                    messageContact?.contact_number ||
                    contactNumber ||
                    "",
                contact_avatar: contact.contact_avatar,
                contact_bio: contact.contact_bio,
            });
            const response = await electronApiFetch("/api/contacts", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contactId: contact.contact_id,
                    encryptedContact,
                }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null) as { error?: string } | null;
                throw new Error(payload?.error ?? "Failed to update contact name.");
            }

            window.dispatchEvent(new Event("contacts:changed"));
            setIsEditingContactName(false);
        } catch (error) {
            setGroupError(error instanceof Error ? error.message : "Failed to update contact name.");
        } finally {
            setPendingAction(null);
        }
    };

    const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";

        if (!file || !chatId || !isCurrentUserAdmin) {
            return;
        }

        const recipients = groupMembers
            .filter((member) => member.user_id && member.public_key)
            .map((member) => ({
                recipientUserId: member.user_id,
                publicKey: member.public_key!,
            }));

        if (recipients.length === 0) {
            setGroupError("Group members are missing encryption keys.");
            return;
        }

        setPendingAction("avatar");
        setGroupError(null);

        try {
            const upload = await uploadEncryptedMessageMedia(file, recipients, null);
            const response = await fetch(`https://halabakk-web.nawaf-alhasosah.workers.dev/api/chats/${encodeURIComponent(chatId)}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ avatar: upload.mediaUrl }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null) as { error?: string } | null;
                throw new Error(payload?.error ?? "Failed to update group avatar.");
            }

            const payload = await response.json() as { chat: RawChatItem };
            mergeUpdatedChat(payload.chat);
        } catch (error) {
            setGroupError(error instanceof Error ? error.message : "Failed to update group avatar.");
        } finally {
            setPendingAction(null);
        }
    };

    const handleMemberMenuOpen = (
        event: React.MouseEvent<HTMLElement>,
        member: ChatGroupMember
    ) => {
        event.stopPropagation();
        setMemberMenuAnchor(event.currentTarget);
        setActiveMember(member);
    };

    const handleMemberMenuClose = () => {
        setMemberMenuAnchor(null);
        setActiveMember(null);
    };

    const updateMemberAdmin = async (member: ChatGroupMember, isAdmin: boolean) => {
        if (!chatId) {
            return;
        }

        setPendingAction(`admin-${member.user_id}`);
        setGroupError(null);

        try {
            const response = await fetch(`https://halabakk-web.nawaf-alhasosah.workers.dev/api/chats/${encodeURIComponent(chatId)}/members`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberUserId: member.user_id, isAdmin }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null) as { error?: string } | null;
                throw new Error(payload?.error ?? "Failed to update member.");
            }

            const payload = await response.json() as { chat: RawChatItem };
            mergeUpdatedChat(payload.chat);
        } catch (error) {
            setGroupError(error instanceof Error ? error.message : "Failed to update member.");
        } finally {
            setPendingAction(null);
            handleMemberMenuClose();
        }
    };

    const removeMember = async (member: ChatGroupMember) => {
        if (!chatId) {
            return;
        }

        setPendingAction(`remove-${member.user_id}`);
        setGroupError(null);

        try {
            const response = await fetch(`https://halabakk-web.nawaf-alhasosah.workers.dev/api/chats/${encodeURIComponent(chatId)}/members`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ memberUserId: member.user_id }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null) as { error?: string } | null;
                throw new Error(payload?.error ?? "Failed to remove member.");
            }

            const payload = await response.json() as { chat: RawChatItem };
            mergeUpdatedChat(payload.chat);
        } catch (error) {
            setGroupError(error instanceof Error ? error.message : "Failed to remove member.");
        } finally {
            setPendingAction(null);
            handleMemberMenuClose();
        }
    };

    const handleExitGroupClick = () => {
        if (!chatId || !isGroup || pendingAction === "exit") {
            return;
        }

        setExitConfirmOpen(true);
    };

    const handleCancelExitGroup = () => {
        if (pendingAction === "exit") {
            return;
        }

        setExitConfirmOpen(false);
    };

    const handleConfirmExitGroup = async () => {
        if (!chatId || !isGroup) {
            return;
        }

        setPendingAction("exit");
        setGroupError(null);

        try {
            const response = await fetch(`https://halabakk-web.nawaf-alhasosah.workers.dev/api/chats/${encodeURIComponent(chatId)}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null) as { error?: string } | null;
                throw new Error(payload?.error ?? "Failed to exit group.");
            }

            removeChat(chatId);
            closeDetails();
            setExitConfirmOpen(false);
        } catch (error) {
            setGroupError(error instanceof Error ? error.message : "Failed to exit group.");
        } finally {
            setPendingAction(null);
        }
    };

    const handleToggleBlock = async () => {
        if (!chatId || isGroup || isChatActionUpdating) {
            return;
        }

        await setChatPreference(chatId, "is_blocked_chat", !isBlocked);
    };

    const handleDeleteChatClick = () => {
        if (!chatId || isGroup || isChatActionUpdating) {
            return;
        }

        setDeleteConfirmOpen(true);
    };

    const handleCancelDeleteChat = () => {
        if (pendingAction === "delete") {
            return;
        }

        setDeleteConfirmOpen(false);
    };

    const handleConfirmDeleteChat = async () => {
        if (!chatId || isGroup) {
            return;
        }

        setPendingAction("delete");
        setGroupError(null);

        try {
            await deleteChatForCurrentUser(chatId);
            closeDetails();
            setDeleteConfirmOpen(false);
        } catch (error) {
            setGroupError(error instanceof Error ? error.message : "Failed to delete chat.");
        } finally {
            setPendingAction(null);
        }
    };

    const handleInviteMembers = async () => {
        if (!chatId || !isCurrentUserAdmin || selectedInviteIds.length === 0) {
            return;
        }

        const selectedContacts = inviteCandidates.filter(
            (contact) =>
                contact.linked_user_id &&
                selectedInviteIds.includes(contact.linked_user_id)
        );
        const recipientsByUserId = new Map<string, { userId: string; publicKey: string }>();

        for (const member of groupMembers) {
            if (member.user_id && member.public_key) {
                recipientsByUserId.set(member.user_id, {
                    userId: member.user_id,
                    publicKey: member.public_key,
                });
            }
        }

        for (const contact of selectedContacts) {
            if (contact.linked_user_id && contact.linked_user_public_key) {
                recipientsByUserId.set(contact.linked_user_id, {
                    userId: contact.linked_user_id,
                    publicKey: contact.linked_user_public_key,
                });
            }
        }

        setPendingAction("invite");
        setGroupError(null);

        try {
            const encryptedPreview = await encryptTextForRecipients(
                "Added to group",
                [...recipientsByUserId.values()]
            );
            const response = await fetch(`https://halabakk-web.nawaf-alhasosah.workers.dev/api/chats/${encodeURIComponent(chatId)}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    memberUserIds: selectedInviteIds,
                    encryptedChatPreview: encryptedPreview.encryptedContent,
                    chatPreviewRecipientKeys:
                        encryptedPreview.recipientEncryptionKeys,
                }),
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null) as { error?: string } | null;
                throw new Error(payload?.error ?? "Failed to invite members.");
            }

            const payload = await response.json() as { chat: RawChatItem };
            mergeUpdatedChat(payload.chat);
            setSelectedInviteIds([]);
            setInviteOpen(false);
        } catch (error) {
            setGroupError(error instanceof Error ? error.message : "Failed to invite members.");
        } finally {
            setPendingAction(null);
        }
    };

    const handleMessageContactPrivatly = () => {
        if (chatId && chatId !== selectedChatId) {
            setSelectedChatId(chatId);
            setRecipientPhone(messageContact?.contact_number ?? contactNumber);
        } else if (messageContact && currentPhone && session?.user.id) {
            openDirectContactChat({
                contact: messageContact,
                currentPhone,
                currentUserId: session.user.id,
            });
        } else {
            return;
        }

        setActiveSubsideBar(null);
        setActiveSideBar("main-chat");
        closeDetails();
    };

    const handleAddUserAsContact = () => {
        const targetPhone = messageContact?.contact_number ?? contactNumber ?? "";

        if (!targetPhone) {
            return;
        }

        const { dialCode, phoneNumber } = splitPhoneNumber(targetPhone);
        const fallbackName =
            messageContact?.contact_first_name ||
            (contactName && contactName !== contactNumber ? contactName : "");
        const fallbackLastName = messageContact?.contact_second_name ?? "";
        const splitName =
            fallbackName && !fallbackLastName
                ? splitFullName(fallbackName)
                : { firstName: fallbackName, lastName: fallbackLastName };

        setFirstName(splitName.firstName);
        setLastName(splitName.lastName);
        setDialCode(dialCode);
        setPhoneNumber(phoneNumber);
        setIsRightSideContactCreateActive(true);
    };

    const listItems = [
        // {
        //     id: '1',
        //     primary: isRTL ? 'ظ†ط¬ظ…ط©' : 'Starred',
        //     secondary: isRTL ? 'ط§ظ„ط±ط³ط§ط¦ظ„ ط§ظ„ظ…ظ…ظٹط²ط©' : 'Starred messages',
        //     icon: StarOutline,
        //     href: 'detailed-starred',
        //     disabled: false,
        //     onClick: undefined as undefined | (() => void),
        // },
        ...(isGroup
            ? [
                {
                    id: 'invite',
                    primary: isRTL ? 'إضافة عضو' : 'Invite new user',
                    secondary: isCurrentUserAdmin
                        ? isRTL
                            ? 'قم بإضافة عضو جديد إلى هذه المجموعة'
                            : 'Add a contact to this group'
                        : isRTL
                            ? 'فقط المشرفين'
                            : 'Admins only',
                    icon: PersonAddOutlined,
                    href: 'group-invite',
                    disabled: !isCurrentUserAdmin,
                    onClick: () => setInviteOpen(true),
                },
            ]
            : []),
    ];

    const secondListItems = isGroup
        ? [
            {
                id: 'exit-group',
                primary: isRTL ? 'الخروج من المجموعة' : 'Exit group',
                icon: LogoutOutlined,
                distructive: true,
                onClick: handleExitGroupClick,
            },
        ]
        : [
            {
                id: '3',
                primary: isRTL ? `حضر ${displayContactName}` : `Block ${displayContactName}`,
                icon: BlockOutlined,
                distructive: true,
                onClick: handleToggleBlock,
            },
            {
                id: '5',
                primary: isRTL ? 'حذف المحادثة' : 'Delete chat',
                icon: DeleteOutlineOutlined,
                distructive: true,
                onClick: handleDeleteChatClick,
            },
        ];

    return (
        <Stack
            spacing={4}
            alignItems={'center'}
            sx={{
                width: '100%',
            }}
        >
            <Stack
                spacing={1}
                alignItems={'center'}
                className='px-5 pt-5'
                sx={{
                    width: '100%',
                }}
            >
                <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleAvatarChange}
                />
                <Box
                    component="button"
                    type="button"
                    disabled={!isGroup || !isCurrentUserAdmin || pendingAction === "avatar"}
                    onClick={() => {
                        if (isGroup && isCurrentUserAdmin) {
                            avatarInputRef.current?.click();
                        }
                    }}
                    sx={{
                        border: 0,
                        p: 0,
                        m: 0,
                        background: "transparent",
                        cursor: isGroup && isCurrentUserAdmin ? "pointer" : "default",
                        position: "relative",
                        borderRadius: "50%",
                        overflow: "hidden",
                        "&:hover .avatar-overlay": {
                            opacity: isGroup && isCurrentUserAdmin ? 1 : 0,
                        },
                    }}
                >
                    <DecryptedProfileImage
                        imageUrl={avatar || ""}
                        fallback={isGroup ? <Group className='size-16!' /> : <Person className='size-16!' />}
                        sx={(theme) => ({
                            width: 120,
                            height: 120,
                            backgroundColor: theme.palette.mode === "dark" ? "#103529" : "#D9FDD3",
                            color: theme.palette.mode === "dark" ? "#25D366" : "#1F4E2E",
                            border: `1px solid ${theme.palette.mode === "dark" ? "#24453B" : "#C4DCC0"}`,
                        })}
                    />
                    {isGroup && isCurrentUserAdmin ? (
                        <Box
                            className="avatar-overlay"
                            sx={(theme) => ({
                                position: "absolute",
                                inset: 0,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "4px",
                                backgroundColor:
                                    theme.palette.mode === "dark"
                                        ? "rgba(0, 0, 0, 0.65)"
                                        : "rgba(0, 0, 0, 0.45)",
                                opacity: 0,
                                transition: "opacity 0.2s ease",
                            })}
                        >
                            {pendingAction === "avatar" ? (
                                <CircularProgress size={24} sx={{ color: "#ffffff" }} />
                            ) : (
                                <>
                                    <AddAPhoto sx={{ width: 22, height: 22, color: "#ffffff" }} />
                                    <Typography
                                        sx={{
                                            fontSize: 10,
                                            fontWeight: 600,
                                            color: "#ffffff",
                                            textAlign: "center",
                                            lineHeight: 1.2,
                                            px: 1,
                                            textTransform: "uppercase",
                                        }}
                                    >
                                        {isRTL ? 'إضافة صورة' : 'Add Photo'}
                                    </Typography>
                                </>
                            )}
                        </Box>
                    ) : null}
                </Box>
                {isGroup && isEditingName ? (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
                        <TextField
                            variant="standard"
                            value={groupNameDraft}
                            onChange={(event) => setGroupNameDraft(event.target.value)}
                            fullWidth
                            autoFocus
                            inputProps={{ maxLength: 80 }}
                        />
                        <IconButton
                            type="button"
                            onClick={() => void handleSaveGroupName()}
                            disabled={!groupNameDraft.trim() || pendingAction === "name"}
                            sx={{ color: "#25D366" }}
                        >
                            {pendingAction === "name" ? (
                                <CircularProgress size={18} />
                            ) : (
                                <Check />
                            )}
                        </IconButton>
                    </Stack>
                ) : !isGroup && isEditingContactName ? (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
                        <TextField
                            variant="standard"
                            value={contactNameDraft}
                            onChange={(event) => setContactNameDraft(event.target.value)}
                            fullWidth
                            autoFocus
                            inputProps={{ maxLength: 80 }}
                        />
                        <IconButton
                            type="button"
                            onClick={() => void handleSaveContactName()}
                            disabled={
                                !contactNameDraft.trim() ||
                                pendingAction === "contact-name" ||
                                !areCryptoKeysReady
                            }
                            sx={{ color: "#25D366" }}
                        >
                            {pendingAction === "contact-name" ? (
                                <CircularProgress size={18} />
                            ) : (
                                <Check />
                            )}
                        </IconButton>
                    </Stack>
                ) : (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant='h6'>
                            {displayContactName}
                        </Typography>
                        {isGroup && isCurrentUserAdmin ? (
                            <IconButton
                                type="button"
                                size="small"
                                onClick={() => setIsEditingName(true)}
                            >
                                <EditOutlined sx={{ fontSize: 18 }} />
                            </IconButton>
                        ) : null}
                        {isSavedSingleContact ? (
                            <IconButton
                                type="button"
                                size="small"
                                onClick={() => setIsEditingContactName(true)}
                            >
                                <EditOutlined sx={{ fontSize: 18 }} />
                            </IconButton>
                        ) : null}
                    </Stack>
                )}
                <Typography
                    variant='body1'
                    className='text-gray-400!'
                    sx={{ direction: 'ltr' }}
                >
                    {isGroup
                        ? `${groupMembers.length} ${groupMembers.length === 1 ? "member" : "members"}`
                        : contactNumber}
                </Typography>
                {groupError ? (
                    <Alert severity="error" sx={{ width: "100%" }}>
                        {groupError}
                    </Alert>
                ) : null}
                {!isGroup && (
                    <Box
                        sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 2,
                        }}
                    >
                        {chatId !== selectedChatId && (
                            <div className='flex flex-col items-center justify-center space-y-1'>
                                <IconButton onClick={handleMessageContactPrivatly} size="large" sx={{ color: '#25D366' }}>
                                    <AddComment fontSize='small' />
                                </IconButton>
                                <Typography sx={{ color: '#25D366' }} variant='body2'>
                                    Message
                                </Typography>
                            </div>
                        )}
                        {canAddSingleContact && (
                            <div onClick={handleAddUserAsContact} className='flex flex-col items-center justify-center space-y-1'>
                                <IconButton size="large" sx={{ color: '#25D366' }}>
                                    <PersonAdd fontSize='small' />
                                </IconButton>
                                <Typography sx={{ color: '#25D366' }} variant='body2'>
                                    Add
                                </Typography>
                            </div>
                        )}
                    </Box>
                )}
            </Stack>
            {!isGroup ? (
                <Stack
                    spacing={1}
                    sx={{
                        width: '100%',
                    }}
                >
                    <Typography
                        variant='body1'
                        className='text-gray-400!'
                    >
                        {isRTL ? 'نبذة' : 'About'}
                    </Typography>
                    <Typography
                        variant='body1'
                    >
                        {biography}
                    </Typography>
                    <Divider />
                </Stack>
            ) : null}
            <Stack
                spacing={1}
                sx={{
                    width: '100%',
                }}
            >
                <ListItemButton
                    onClick={open}
                    sx={(theme) => ({
                        width: "100%",
                        borderRadius: 3,
                        padding: 0,
                        marginY: '2px',
                        backgroundColor: "transparent",
                        boxShadow: "0px 4px 20px rgba(0,0,0,0)",
                        textTransform: "inherit",
                        color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",

                        "&:hover": {
                            boxShadow: "0px 4px 20px rgba(0,0,0,0)",
                            backgroundColor: theme.palette.mode === "dark" ? "#333" : "#eee",
                        },
                    })}
                >
                    <ListItem
                        sx={{
                            paddingY: 1,
                            paddingX: 2,
                            textAlign: isRTL ? 'left' : 'right',
                            '& .MuiListItem-secondaryAction': {
                                right: isRTL ? 'auto' : 16,
                                left: isRTL ? 16 : 'auto',
                            }
                        }}
                        secondaryAction={
                            <Typography
                                variant='body1'
                                className='text-gray-400!'
                            >
                                {mediaCount || 0}
                            </Typography>
                        }
                    >
                        <ListItemIcon>
                            <CollectionsOutlined className='size-6! text-gray-600 dark:text-gray-300' />
                        </ListItemIcon>
                        <ListItemText
                            primary={isRTL ? 'وسائط, روابط و مستندات' : 'Media, links & docs'}
                            sx={{
                                transition: "max-width 100ms ease",
                                maxWidth: "75%",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                textOverflow: "ellipsis",
                                display: "block",
                            }}
                        />
                    </ListItem>
                </ListItemButton>
                {mediaItems.length > 0 ? (
                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                            gap: 1,
                            width: '100%',
                            mt: 1,
                        }}
                    >
                        {mediaItems.map((item) => (
                            <DetailedSidebarMediaTile
                                key={item.id}
                                item={item}
                            />
                        ))}
                    </Box>
                ) : null}
                <Divider />
            </Stack>
            <Stack
                spacing={1}
                sx={{
                    width: '100%',
                }}
            >
                {listItems.map((item) => (
                    <ListItemButton
                        key={item.id}
                        disabled={item.disabled}
                        onClick={item.onClick}
                        sx={(theme) => ({
                            width: "100%",
                            borderRadius: 3,
                            padding: 0,
                            marginY: '2px',
                            backgroundColor: "transparent",
                            boxShadow: "0px 4px 20px rgba(0,0,0,0)",
                            textTransform: "inherit",
                            color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",

                            "&:hover": {
                                boxShadow: "0px 4px 20px rgba(0,0,0,0)",
                                backgroundColor: theme.palette.mode === "dark" ? "#333" : "#eee",
                            },
                            "& .MuiListItemText-secondary": {
                                maxWidth: "100%",
                            },
                        })}
                    >
                        <ListItem
                            sx={{
                                paddingY: 1,
                                paddingX: 2,
                            }}
                        >
                            <ListItemIcon>
                                <item.icon className='size-6! text-gray-600 dark:text-gray-300' />
                            </ListItemIcon>
                            <ListItemText
                                primary={item.primary}
                                sx={{
                                    display: "block",
                                }}
                                secondary={item.secondary}
                                secondaryTypographyProps={{
                                    noWrap: true,
                                    sx: {
                                        display: "block",
                                        maxWidth: "100%",
                                    },
                                }}
                            />
                        </ListItem>
                    </ListItemButton>
                ))}
                <ListItem
                    sx={{
                        padding: isRTL ? '8px 0 8px 16px' : '8px 16px 8px 0',
                        paddingY: 1,
                        paddingX: 2,
                        justifyContent: 'space-between',
                    }}
                >
                    <ListItemIcon>
                        <NotificationsOutlined className='size-6! text-gray-600 dark:text-gray-300' />
                    </ListItemIcon>
                    <ListItemText
                        primary={isRTL ? 'كتم الإشعارات' : 'Mute notifications'}
                        sx={{
                            display: "block",
                            textAlign: isRTL ? 'right' : 'left',
                        }}
                        secondary={
                            isRTL ?
                                'قم بكتم الإشعارات لدى هذه المحادثة' :
                                'Turn off notifications for this conversation'
                        }
                        secondaryTypographyProps={{
                            sx: {
                                display: "block",
                                maxWidth: "100%",
                                textAlign: isRTL ? 'right' : 'left',
                            },
                        }}
                    />
                    <Switch
                        edge="end"
                        onChange={handleToggleNotifications}
                        checked={isMuted}
                        disabled={!chatId || isToggling}
                        inputProps={{
                            'aria-labelledby': 'switch-list-label-receipt',
                        }}
                        sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                                color: '#25D366',
                                '&:hover': {
                                    backgroundColor: 'rgba(37, 211, 102, 0.08)',
                                },
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                backgroundColor: '#25D366',
                            },
                        }}
                    />
                </ListItem>
                {isGroup ? (
                    <>
                        <Divider />
                        <Typography variant="body1" className="text-gray-400!">
                            {isRTL ? 'أعضاء المجموعة' : 'Group members'}
                        </Typography>
                        <List sx={{ width: "100%", p: 0 }}>
                            {groupMembers.map((member) => {
                                const memberName = getMemberDisplayName(member, contacts);
                                const isSelf = member.user_id === currentUserId;
                                const showActions = isCurrentUserAdmin && !isSelf;

                                return (
                                    <ListItemButton
                                        key={member.user_id}
                                        sx={(theme) => ({
                                            width: "100%",
                                            borderRadius: 3,
                                            padding: 0,
                                            marginY: "2px",
                                            backgroundColor: "transparent",
                                            color:
                                                theme.palette.mode === "dark"
                                                    ? "#ffffff"
                                                    : "#000000",
                                            "&:hover": {
                                                backgroundColor:
                                                    theme.palette.mode === "dark"
                                                        ? "#333"
                                                        : "#eee",
                                                "& .member-action": {
                                                    opacity: showActions ? 1 : 0,
                                                    pointerEvents: showActions ? "auto" : "none",
                                                },
                                            },
                                        })}
                                    >
                                        <ListItem sx={{ py: 1, px: 2 }}>
                                            <ListItemAvatar>
                                                <DecryptedProfileImage
                                                    imageUrl={getMemberAvatar(member, contacts)}
                                                    fallback={<Person />}
                                                    sx={(theme) => ({
                                                        width: 42,
                                                        height: 42,
                                                        backgroundColor:
                                                            theme.palette.mode === "dark"
                                                                ? "#103529"
                                                                : "#D9FDD3",
                                                        color:
                                                            theme.palette.mode === "dark"
                                                                ? "#25D366"
                                                                : "#1F4E2E",
                                                    })}
                                                />
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={isSelf ? `${memberName} (You)` : memberName}
                                                secondary={member.phone_number}
                                            />
                                            {member.is_admin ? (
                                                <Chip
                                                    label="Admin"
                                                    size="small"
                                                    sx={{
                                                        mr: 1,
                                                        backgroundColor: "#25D36622",
                                                        color: "#1E9A4D",
                                                    }}
                                                />
                                            ) : null}
                                            {showActions ? (
                                                <IconButton
                                                    className="member-action"
                                                    size="small"
                                                    onClick={(event) =>
                                                        handleMemberMenuOpen(event, member)
                                                    }
                                                    sx={{
                                                        opacity: 0,
                                                        pointerEvents: "none",
                                                        transition: "opacity 100ms ease",
                                                    }}
                                                >
                                                    <ExpandMoreOutlined />
                                                </IconButton>
                                            ) : null}
                                        </ListItem>
                                    </ListItemButton>
                                );
                            })}
                        </List>
                    </>
                ) : null}
            </Stack>
            <Divider />
            <Stack
                spacing={1}
                sx={{
                    width: '100%',
                }}
            >
                {secondListItems.map((item) => (
                    <ListItemButton
                        key={item.id}
                        onClick={item.onClick}
                        disabled={pendingAction === "exit"}
                        sx={(theme) => ({
                            width: "100%",
                            borderRadius: 3,
                            padding: 0,
                            marginY: '2px',
                            backgroundColor: "transparent",
                            boxShadow: "0px 4px 20px rgba(0,0,0,0)",
                            textTransform: "inherit",
                            color: item.distructive ? '#fa99a4' : theme.palette.mode === "dark" ? "#ffffff" : "#000000",

                            "&:hover": {
                                boxShadow: "0px 4px 20px rgba(0,0,0,0)",
                                backgroundColor: theme.palette.mode === "dark" ? "#333" : "#eee",
                            },
                            "& .MuiListItemText-secondary": {
                                maxWidth: "100%",
                            },
                        })}
                    >
                        <ListItem
                            sx={{
                                paddingY: 1,
                                paddingX: 2,
                            }}
                        >
                            <ListItemIcon>
                                <item.icon className={`size-6! ${item.distructive ? 'text-[#fa99a4]' : 'text-gray-600 dark:text-gray-300'}`} />
                            </ListItemIcon>
                            <ListItemText
                                primary={item.primary}
                                sx={{
                                    display: "block",
                                }}
                            />
                        </ListItem>
                    </ListItemButton>
                ))}
            </Stack>
            <Menu
                anchorEl={memberMenuAnchor}
                open={Boolean(memberMenuAnchor)}
                onClose={handleMemberMenuClose}
                PaperProps={{
                    sx: (theme) => ({
                        backgroundColor: theme.palette.mode === "dark" ? "#222424" : "#ffffff",
                        borderRadius: 3,
                        boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
                    }),
                }}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                    sx: {
                        padding: 1,
                    },
                }}
            >
                {activeMember ? (
                    <>
                        <MenuItem
                            disabled={Boolean(pendingAction)}
                            onClick={() =>
                                void updateMemberAdmin(
                                    activeMember,
                                    !activeMember.is_admin
                                )
                            }
                            sx={(theme) => ({
                                "&:hover": {
                                    backgroundColor: theme.palette.mode === "dark" ? "#333" : "#eee",
                                },
                                borderRadius: 2,
                                paddingY: 1,
                                paddingX: 1
                            })}
                        >
                            {activeMember.is_admin ? "Remove admin" : "Make admin"}
                        </MenuItem>
                        <MenuItem
                            disabled={Boolean(pendingAction)}
                            onClick={() => void removeMember(activeMember)}
                            sx={(theme) => ({
                                "&:hover": {
                                    backgroundColor: theme.palette.mode === "dark" ? "#333" : "#eee",
                                },
                                color: "#fa99a4",
                                borderRadius: 2,
                                paddingY: 1,
                                paddingX: 1
                            })}
                        >
                            Remove from group
                        </MenuItem>
                    </>
                ) : null}
            </Menu>
            <Dialog
                open={exitConfirmOpen}
                onClose={handleCancelExitGroup}
                aria-labelledby="exit-group-confirm-title"
                aria-describedby="exit-group-confirm-description"
                PaperProps={{
                    sx: {
                        borderRadius: "16px",
                        minWidth: { xs: "calc(100vw - 32px)", sm: "450px" },
                        padding: "4px",
                        backgroundColor: (theme) =>
                            theme.palette.mode === "dark" ? "#222424" : "#ffffff",
                        boxShadow: "0px 12px 30px rgba(0, 0, 0, 0.08)",
                    },
                }}
            >
                <DialogTitle
                    id="exit-group-confirm-title"
                    sx={{
                        fontWeight: 700,
                        fontSize: "18px",
                        color: (theme) =>
                            theme.palette.mode === "dark" ? "#FFFFFF" : "#1C1C1C",
                        textAlign: isRTL ? "right" : "left",
                    }}
                >
                    Exit group?
                </DialogTitle>
                <DialogContent sx={{ paddingTop: "4px" }}>
                    <Typography
                        id="exit-group-confirm-description"
                        sx={{
                            color: (theme) =>
                                theme.palette.mode === "dark" ? "#CFCFCF" : "#5A5A5A",
                            fontSize: "14px",
                            textAlign: isRTL ? "right" : "left",
                        }}
                    >
                        You will leave this group and it will be removed from your chat list.
                    </Typography>
                </DialogContent>
                <DialogActions
                    sx={{
                        padding: "12px 16px 16px 16px",
                        gap: "8px",
                        ...(isRTL && { flexDirection: "row-reverse" }),
                    }}
                >
                    <Button
                        onClick={handleCancelExitGroup}
                        variant="outlined"
                        disabled={pendingAction === "exit"}
                        sx={{
                            borderRadius: "99px",
                            borderColor: (theme) =>
                                theme.palette.mode === "dark" ? "#3A3A3A" : "#DCDCDC",
                            color: (theme) =>
                                theme.palette.mode === "dark" ? "#D8D8D8" : "#5A5A5A",
                            textTransform: "none",
                            padding: "8px 16px",
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => void handleConfirmExitGroup()}
                        variant="contained"
                        disabled={pendingAction === "exit"}
                        sx={{
                            borderRadius: "99px",
                            backgroundColor: "#25D366",
                            color: "#0B1B12",
                            textTransform: "none",
                            padding: "8px 16px",
                            boxShadow: "0px 0px 0px rgba(0, 0, 0, 0.0)",
                            "&:hover": {
                                backgroundColor: "#1FB75A",
                            },
                            "&.Mui-disabled": {
                                backgroundColor: (theme) =>
                                    theme.palette.mode === "dark" ? "#2D4035" : "#CFEFDB",
                                color: (theme) =>
                                    theme.palette.mode === "dark" ? "#A1B6A8" : "#6B8F7A",
                            },
                        }}
                    >
                        {pendingAction === "exit" ? (
                            <CircularProgress size={18} />
                        ) : (
                            "Exit"
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog
                open={deleteConfirmOpen}
                onClose={handleCancelDeleteChat}
                aria-labelledby="delete-chat-confirm-title"
                aria-describedby="delete-chat-confirm-description"
                PaperProps={{
                    sx: {
                        borderRadius: "16px",
                        minWidth: { xs: "calc(100vw - 32px)", sm: "450px" },
                        padding: "4px",
                        backgroundColor: (theme) =>
                            theme.palette.mode === "dark" ? "#222424" : "#ffffff",
                        boxShadow: "0px 12px 30px rgba(0, 0, 0, 0.08)",
                    },
                }}
            >
                <DialogTitle
                    id="delete-chat-confirm-title"
                    sx={{
                        fontWeight: 700,
                        fontSize: "18px",
                        color: (theme) =>
                            theme.palette.mode === "dark" ? "#FFFFFF" : "#1C1C1C",
                        textAlign: isRTL ? "right" : "left",
                    }}
                >
                    Delete chat?
                </DialogTitle>
                <DialogContent sx={{ paddingTop: "4px" }}>
                    <Typography
                        id="delete-chat-confirm-description"
                        sx={{
                            color: (theme) =>
                                theme.palette.mode === "dark" ? "#CFCFCF" : "#5A5A5A",
                            fontSize: "14px",
                            textAlign: isRTL ? "right" : "left",
                        }}
                    >
                        Messages will be deleted permanently for you. This will not delete the chat for the other person.
                    </Typography>
                </DialogContent>
                <DialogActions
                    sx={{
                        padding: "12px 16px 16px 16px",
                        gap: "8px",
                        ...(isRTL && { flexDirection: "row-reverse" }),
                    }}
                >
                    <Button
                        onClick={handleCancelDeleteChat}
                        variant="outlined"
                        disabled={pendingAction === "delete"}
                        sx={{
                            borderRadius: "99px",
                            borderColor: (theme) =>
                                theme.palette.mode === "dark" ? "#3A3A3A" : "#DCDCDC",
                            color: (theme) =>
                                theme.palette.mode === "dark" ? "#D8D8D8" : "#5A5A5A",
                            textTransform: "none",
                            padding: "8px 16px",
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={() => void handleConfirmDeleteChat()}
                        variant="contained"
                        disabled={pendingAction === "delete"}
                        sx={{
                            borderRadius: "99px",
                            backgroundColor: "#25D366",
                            color: "#0B1B12",
                            textTransform: "none",
                            padding: "8px 16px",
                            boxShadow: "none",
                            "&:hover": {
                                backgroundColor: "#1FB75A",
                            },
                        }}
                    >
                        {pendingAction === "delete" ? (
                            <CircularProgress size={18} />
                        ) : (
                            "Delete"
                        )}
                    </Button>
                </DialogActions>
            </Dialog>
            <Dialog
                open={inviteOpen}
                onClose={() => setInviteOpen(false)}
                fullWidth
                maxWidth={false}
                PaperProps={{
                    sx: (theme) => ({
                        backgroundColor:
                            theme.palette.mode === "dark" ? "#161717" : "#FFFFFF",
                        boxShadow: 0,
                        p: 0,
                        borderRadius: "18px",
                        width: "440px",
                        maxWidth: "calc(100vw - 32px)",
                        marginY: "auto",
                        height: "100%",
                        maxHeight: "calc(100vh - 200px)",
                        overflow: "hidden",
                        position: "relative",
                        "& > .MuiDialogTitle-root": {
                            display: "none",
                        },
                    }),
                }}
            >
                <div className="flex flex-row items-center gap-x-3 p-2">
                    <IconButton onClick={() => setInviteOpen(false)}>
                        <CloseOutlined />
                    </IconButton>
                    <Typography>
                        {isRTL ? 'دعوة عضو' : 'Invite new user'}
                    </Typography>
                </div>
                <DialogTitle>{isRTL ? 'دعوة عضو' : 'Invite new user'}</DialogTitle>
                <Box sx={{ px: 5 }}>
                    <TextField
                        hiddenLabel
                        variant="filled"
                        size="small"
                        placeholder="Search name or number"
                        fullWidth
                        value={inviteSearchQuery}
                        onChange={(event) => setInviteSearchQuery(event.target.value)}
                        inputRef={inviteInputRef}
                        sx={(theme) => ({
                            "& .MuiFilledInput-root": {
                                borderRadius: 8,
                                "&.Mui-focused": {
                                    outline: "2px solid #25D366",
                                    backgroundColor:
                                        theme.palette.mode === "dark"
                                            ? "#2B2C2C"
                                            : "#ffffff",
                                },
                            },
                            width: "100%",
                        })}
                        InputProps={{
                            disableUnderline: true,
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchOutlined
                                        sx={{
                                            color: (theme) =>
                                                theme.palette.mode === "dark"
                                                    ? "#A5A5A5"
                                                    : "#636261",
                                            width: 20,
                                            height: 20,
                                        }}
                                    />
                                </InputAdornment>
                            ),
                            endAdornment: inviteSearchQuery ? (
                                <InputAdornment position="end">
                                    <IconButton onClick={handleInviteSearchClear} size="small">
                                        <CloseOutlined
                                            sx={{
                                                color: (theme) =>
                                                    theme.palette.mode === "dark"
                                                        ? "#A5A5A5"
                                                        : "#636261",
                                                width: 18,
                                                height: 18,
                                            }}
                                        />
                                    </IconButton>
                                </InputAdornment>
                            ) : null,
                        }}
                    />
                </Box>
                <Box sx={{ my: 2.5, px: 6 }}>
                    <Typography
                        variant="caption"
                        sx={{
                            fontWeight: 600,
                            color: (theme) =>
                                theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
                            fontSize: 14,
                        }}
                    >
                        Contacts
                    </Typography>
                </Box>
                <DialogContent sx={{ p: 0, overflow: "hidden" }}>
                    {inviteCandidates.length === 0 ? (
                        <Typography color="text.secondary">
                            {isRTL ? 'لا يوجد جهاة إتصال ليتم دعوتها' : 'No eligible contacts to invite.'}
                        </Typography>
                    ) : (
                        <List
                            sx={{
                                bgcolor: "transparent",
                                overflowY: "scroll",
                                height: "83%",
                                paddingX: "20px",
                                paddingBottom: selectedInviteIds.length > 0 ? "78px" : 0,
                            }}
                        >
                            {visibleInviteCandidates.map((contact) => {
                                const linkedUserId = contact.linked_user_id!;
                                const checked = selectedInviteIds.includes(linkedUserId);

                                return (
                                    <ListItemButton
                                        key={contact.contact_id}
                                        onClick={() =>
                                            setSelectedInviteIds((current) =>
                                                checked
                                                    ? current.filter((id) => id !== linkedUserId)
                                                    : [...current, linkedUserId]
                                            )
                                        }
                                        sx={(theme) => ({
                                            display: "flex",
                                            flexDirection: "row-reverse",
                                            justifyContent: "space-between",
                                            alignItems: "center",
                                            borderRadius: 3,
                                            backgroundColor: "transparent",
                                            boxShadow: "0px 4px 20px rgba(0,0,0,0)",
                                            textTransform: "inherit",
                                            color:
                                                theme.palette.mode === "dark"
                                                    ? "#ffffff"
                                                    : "#000000",
                                            "&:hover": {
                                                boxShadow: "0px 4px 20px rgba(0,0,0,0)",
                                                backgroundColor:
                                                    theme.palette.mode === "dark"
                                                        ? "#333"
                                                        : "#eee",
                                            },
                                            "& .MuiListItemText-secondary": {
                                                maxWidth: "100%",
                                            },
                                        })}
                                    >
                                        <ListItemAvatar>
                                            <DecryptedProfileImage
                                                imageUrl={contact.contact_avatar ?? ""}
                                                fallback={<Person />}
                                                sx={{
                                                    width: 45,
                                                    height: 45,
                                                    backgroundColor: (theme) =>
                                                        theme.palette.mode === "dark"
                                                            ? "#103529"
                                                            : "#D9FDD3",
                                                    color: (theme) =>
                                                        theme.palette.mode === "dark"
                                                            ? "#25D366"
                                                            : "#1F4E2E",
                                                }}
                                            />
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={getContactDisplayName(contact)}
                                            secondary={contact.contact_number}
                                            sx={{
                                                overflow: "hidden",
                                                "& .MuiListItemText-secondary": {
                                                    color: (theme) =>
                                                        theme.palette.mode === "dark"
                                                            ? "#A5A5A5"
                                                            : "#636261",
                                                },
                                            }}
                                            secondaryTypographyProps={{
                                                noWrap: true,
                                                sx: {
                                                    overflow: "hidden",
                                                    display: "block",
                                                    maxWidth: "100%",
                                                    color: (theme) =>
                                                        theme.palette.mode === "dark"
                                                            ? "#A5A5A5"
                                                            : "#636261",
                                                },
                                            }}
                                        />
                                        <Checkbox
                                            checked={checked}
                                            tabIndex={-1}
                                            disableRipple
                                            sx={{
                                                "&.Mui-checked": {
                                                    color: "#25D366",
                                                },
                                            }}
                                        />
                                    </ListItemButton>
                                );
                            })}
                        </List>
                    )}
                </DialogContent>
                <DialogActions
                    sx={{
                        position: "absolute",
                        zIndex: 10,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        display: selectedInviteIds.length > 0 ? "flex" : "none",
                        alignItems: "center",
                        justifyContent: "space-between",
                        px: 4,
                        py: 3,
                        backgroundColor: (theme) =>
                            theme.palette.mode === "dark" ? "#2B2C2C" : "#F0F0F0",
                    }}
                >
                    <Typography
                        component="span"
                        sx={{
                            display: "block",
                            maxWidth: "70%",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                        }}
                    >
                        {selectedInviteLabels.join(", ")}
                    </Typography>
                    <Button onClick={() => setInviteOpen(false)} sx={{ display: "none" }}>
                        {isRTL ? 'إلغاء' : 'Cancel'}
                    </Button>
                    <Button
                        onClick={() => void handleInviteMembers()}
                        disabled={selectedInviteIds.length === 0 || pendingAction === "invite"}
                        variant="contained"
                        startIcon={pendingAction === "invite" ? undefined : <Check />}
                        sx={{
                            minWidth: 44,
                            width: 44,
                            height: 44,
                            borderRadius: "50%",
                            p: 0,
                            fontSize: 0,
                            backgroundColor: "#25D366",
                            color: "#161717",
                            boxShadow: "none",
                            "& .MuiButton-startIcon": {
                                m: 0,
                            },
                            "&:hover": {
                                backgroundColor: "#25D366",
                                color: "#161717",
                                boxShadow: "none",
                            },
                            "&.Mui-disabled": {
                                backgroundColor: "#25D36699",
                                color: "#16171799",
                            },
                        }}
                    >
                        {pendingAction === "invite" ? (
                            <CircularProgress size={18} />
                        ) : isRTL ? 'دعوة' : 'Invite'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    )
}
