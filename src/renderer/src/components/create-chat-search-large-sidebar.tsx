import { useCryptoKeys } from "../context/crypto";
import { matchesContactSearch } from "../lib/contact-crypto";
import { useDecryptedContacts } from "../hooks/use-decrypted-contacts";
import {
    getContactDisplayName,
    resolveDirectChatContact,
} from "../lib/contact-display";
import { groupContactsByLetter } from "../lib/contact-organizer";
import { getLocaleFromCookie, isRTLClient } from "../lib/locale-client";
import { authClient } from "../lib/auth-client";
import { useActiveChatStore } from "../store/use-active-chat-store";
import { useSidebarStore } from "../store/use-active-sidebar-store";
import { useSubsidebarStore } from "../store/use-active-subsidebar-store";
import type { Contact } from "../types/contacts.type";
import {
    CloseOutlined,
    GroupAdd,
    Person,
    PersonAdd,
    SearchOutlined,
} from "@mui/icons-material";
import {
    Avatar,
    CircularProgress,
    List,
    ListItem,
    ListItemAvatar,
    ListItemButton,
    ListItemText,
    Typography,
} from "@mui/material";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import { useMemo, useRef, useState } from "react";
import CreateChatHeaderLargeSidebar from "./create-chat-header-large-sidebar";
import DecryptedProfileImage from "./decrypted-profile-image";
import { canViewProfilePicture } from "../lib/profile-picture-privacy";
import { isManagedProfileImageUrl } from "../lib/profile-image-url";

function getContactAvatarFallback(contact: Contact) {
    return (
        contact.contact_first_name?.[0] ||
        contact.contact_second_name?.[0] ||
        contact.contact_number[0] ||
        ""
    ).toUpperCase();
}

export default function CreateChatSearchLargeSidebar() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const { isReady } = useCryptoKeys();
    const { data: session } = authClient.useSession();
    const { setActiveSubsideBar } = useSubsidebarStore();
    const { setActiveSideBar } = useSidebarStore();
    const openDirectContactChat = useActiveChatStore(
        (state) => state.openDirectContactChat
    );
    const chats = useActiveChatStore((state) => state.chats);
    const currentPhone = (session?.user as { phoneNumber?: string | null } | undefined)
        ?.phoneNumber ?? null;

    const [value, setValue] = useState("");
    const { contacts, isLoading: isLoadingContacts, error: contactsError } =
        useDecryptedContacts();
    const inputRef = useRef<HTMLInputElement>(null);
    const avatarByContactId = useMemo(() => {
        const avatarMap = new Map<string, string>();

        for (const contact of contacts) {
            const directChat = chats.find(
                (chat) =>
                    chat.chat_type === "single" &&
                    Boolean(
                        resolveDirectChatContact(chat, [contact], currentPhone)
                    )
            );
            const contactAvatar =
                contact.contact_avatar &&
                !isManagedProfileImageUrl(contact.contact_avatar)
                    ? contact.contact_avatar
                    : "";

            if (!directChat) {
                avatarMap.set(contact.contact_id, contactAvatar);
                continue;
            }

            const canShowDirectAvatar =
                directChat.recipient_profile_picture_visible ??
                canViewProfilePicture(
                    directChat.recipient_who_can_see_profile_picture,
                    true
                );

            avatarMap.set(
                contact.contact_id,
                canShowDirectAvatar ? directChat.avatar || contactAvatar : ""
            );
        }

        return avatarMap;
    }, [chats, contacts, currentPhone]);

    const filteredContacts = value.trim()
        ? contacts.filter((contact) => matchesContactSearch(contact, value))
        : contacts;
    const groupedContacts = groupContactsByLetter(filteredContacts);

    const handleClear = () => {
        setValue("");
        inputRef.current?.blur();
    };

    const handleContactSelect = (contact: Contact) => {
        if (!currentPhone || !session?.user.id) {
            return;
        }

        openDirectContactChat({
            contact,
            currentPhone,
            currentUserId: session.user.id,
        });
        setActiveSubsideBar(null);
        setActiveSideBar("main-chat");
    };

    return (
        <div className="flex h-full flex-col gap-y-3"> 
            <CreateChatHeaderLargeSidebar />
            <TextField
                hiddenLabel
                id="filled-search-bar"
                variant="filled"
                size="small"
                placeholder={
                    isRTL ? "إبحث عن إسم أو رقم هاتف" : "Search name or number"
                }
                value={value}
                onChange={(event) => setValue(event.target.value)}
                inputRef={inputRef}
                sx={(theme) => ({
                    "& .MuiFilledInput-root": {
                        borderRadius: 8,
                        "&.Mui-focused": {
                            outline: "2px solid #25D366",
                            backgroundColor:
                                theme.palette.mode === "dark"
                                    ? "rgba(28,30,33,0)"
                                    : "#ffffff",
                        },
                    },
                    marginX: "20px",
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
                    endAdornment: value ? (
                        <InputAdornment position="end">
                            <IconButton onClick={handleClear} size="small">
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
            <div className="flex flex-col overflow-y-auto px-5">
                <List>
                    <ListItemButton
                        component="button"
                        type="button"
                        sx={(theme) => ({
                            width: "100%",
                            borderRadius: 3,
                            padding: 0,
                            marginY: "2px",
                            backgroundColor: "transparent",
                            textTransform: "inherit",
                            color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                            "&:hover": {
                                backgroundColor:
                                    theme.palette.mode === "dark"
                                        ? "#242626"
                                        : "#f7f5f3",
                            },
                        })}
                        onClick={() => setActiveSubsideBar("new-group")}
                    >
                        <ListItem sx={{ paddingY: 1, paddingX: 2 }}>
                            <ListItemAvatar>
                                <Avatar
                                    sx={(theme) => ({
                                        width: 50,
                                        height: 50,
                                        marginRight: 2,
                                        backgroundColor: "#25D366",
                                        color: theme.palette.mode === "dark" ? "#1C1E21" : "#FFFFFF",
                                    })}
                                >
                                    <GroupAdd sx={{ width: "30px", height: "30px" }} />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={isRTL ? "مجموعة جديدة" : "New group"}
                            />
                        </ListItem>
                    </ListItemButton>

                    <ListItemButton
                        component="button"
                        type="button"
                        sx={(theme) => ({
                            width: "100%",
                            borderRadius: 3,
                            padding: 0,
                            marginY: "2px",
                            backgroundColor: "transparent",
                            textTransform: "inherit",
                            color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                            "&:hover": {
                                backgroundColor:
                                    theme.palette.mode === "dark"
                                        ? "#242626"
                                        : "#f7f5f3",
                            },
                        })}
                        onClick={() => setActiveSubsideBar("new-contact")}
                    >
                        <ListItem sx={{ paddingY: 1, paddingX: 2 }}>
                            <ListItemAvatar>
                                <Avatar
                                    sx={(theme) => ({
                                        width: 50,
                                        height: 50,
                                        marginRight: 2,
                                        backgroundColor: "#25D366",
                                        color: theme.palette.mode === "dark" ? "#1C1E21" : "#FFFFFF",
                                    })}
                                >
                                    <PersonAdd sx={{ width: "30px", height: "30px" }} />
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={isRTL ? "جهة إتصال جديدة" : "New contact"}
                            />
                        </ListItem>
                    </ListItemButton>
                </List>

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
                        {value.trim()
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

                                    return (
                                        <ListItemButton
                                            component="button"
                                            type="button"
                                            key={contact.contact_id}
                                            onClick={() => handleContactSelect(contact)}
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
                                                    secondary={contact.contact_number}
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
    );
}
