import { ArrowBack, ArrowForward, Group } from "@mui/icons-material";
import Person from "@mui/icons-material/Person";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import ChatRoomMoreActionButton from "./chat-room-more-action-button";
import DecryptedProfileImage from "./decrypted-profile-image";
import { useActiveChatStore } from "../store/use-active-chat-store";
import { useDetailedSidebarStore } from "../store/use-detailed-sidebar-store";
import { authClient } from "../lib/auth-client";
import { getChatDisplayName } from "../lib/chat-utils";
import { useDecryptedContacts } from "../hooks/use-decrypted-contacts";
import {
    canViewLastSeen,
    canViewProfilePicture,
    canViewStatus,
} from "../lib/profile-picture-privacy";
import {
    getContactDisplayName,
    resolveDirectChatContact,
} from "../lib/contact-display";
import { getLocaleFromCookie, isRTLClient } from "../lib/locale-client";
import { isManagedProfileImageUrl } from "../lib/profile-image-url";

function formatLastSeen(value: Date, locale: string | undefined) {
    return `${value.toLocaleDateString(locale ?? undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    })} ${value.toLocaleTimeString(locale ?? undefined, {
        hour: "numeric",
        minute: "2-digit",
    })}`;
}

export default function ChatRoomHeader() {
    const { data: session } = authClient.useSession();
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const selectedChatId = useActiveChatStore((state) => state.selectedChatId);
    const chats = useActiveChatStore((state) => state.chats);
    const presenceByChatId = useActiveChatStore((state) => state.presenceByChatId);
    const setSelectedChatId = useActiveChatStore((state) => state.setSelectedChatId);
    const openDetailedSidebar = useDetailedSidebarStore((state) => state.open);
    const { contacts } = useDecryptedContacts();
    const selectedChat = chats.find((chat) => chat.chat_id === selectedChatId) ?? null;
    const currentPhone = (session?.user as { phoneNumber?: string | null } | undefined)
        ?.phoneNumber ?? null;
    const directContact = selectedChat
        ? resolveDirectChatContact(selectedChat, contacts, currentPhone)
        : null;
    const headerTitle =
        selectedChat?.chat_type === "single" && directContact
            ? getContactDisplayName(directContact)
            : selectedChat
                ? getChatDisplayName(selectedChat, currentPhone)
                : "Chat";
    const canShowHeaderAvatar =
        selectedChat?.chat_type === "single" &&
        (selectedChat.recipient_profile_picture_visible ??
            canViewProfilePicture(
                selectedChat.recipient_who_can_see_profile_picture,
                Boolean(directContact)
            ));
    const directContactAvatar =
        directContact?.contact_avatar &&
        !isManagedProfileImageUrl(directContact.contact_avatar)
            ? directContact.contact_avatar
            : "";
    const headerAvatar =
        selectedChat?.chat_type === "single"
            ? canShowHeaderAvatar
                ? selectedChat.avatar || directContactAvatar
                : ""
            : selectedChat?.avatar ?? "";
    const activePresence = selectedChatId ? presenceByChatId[selectedChatId] : undefined;
    const directRecipientIsSavedContact = Boolean(directContact);
    const canShowLastSeen =
        selectedChat?.chat_type === "single" &&
        (selectedChat.recipient_last_seen_visible ??
            canViewLastSeen(
                selectedChat.recipient_who_can_see_last_seen,
                directRecipientIsSavedContact
            ));
    const canShowDirectStatus =
        selectedChat?.chat_type === "single" &&
        canShowLastSeen;
    const canShowDirectOnline =
        selectedChat?.chat_type === "single" &&
        canShowDirectStatus &&
        canViewStatus(
            selectedChat.recipient_who_can_see_status,
            directRecipientIsSavedContact
        );
    const isDirectRecipientOnline =
        Boolean(
            selectedChat?.chat_type === "single" &&
                canShowDirectOnline &&
                selectedChat.recipient_user_id &&
                activePresence &&
                activePresence.activeUsers.includes(selectedChat.recipient_user_id)
        );
    const subtitle =
        selectedChat?.chat_type === "single"
            ? canShowDirectStatus
                ? isDirectRecipientOnline
                    ? isRTL
                        ? "متصل"
                        : "Online"
                    : selectedChat.recipient_last_seen
                      ? isRTL
                        ? `آخر ظهور ${formatLastSeen(
                              selectedChat.recipient_last_seen,
                              locale ?? undefined
                          )}`
                        : `Last seen ${formatLastSeen(
                              selectedChat.recipient_last_seen,
                              locale ?? undefined
                          )}`
                      : ""
                : ""
            : "Group chat";
    const handleOpenDetails = () => {
        if (!selectedChat) {
            return;
        }

        openDetailedSidebar({
            type: "chat",
            chatId: selectedChat.chat_id,
        });
    };

    return (
        <Box
            component="header"
            className="app-region-drag"
            sx={(theme) => ({
                height: 64,
                width: "100%",
                px: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderRadius: 0,
                boxShadow: "0px 2px 2px rgba(0,0,0,0.08)",
                backgroundColor: theme.palette.mode === "dark" ? "#161717" : "#FFFFFF",
                color: theme.palette.mode === "dark" ? "#FFFFFF" : "#000000",
                "&:hover": {
                    backgroundColor: theme.palette.mode === "dark" ? "#161717" : "#FFFFFF"
                }
            })}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <IconButton
                    type="button"
                    className="md:hidden"
                    onClick={() => setSelectedChatId(null)}
                    size="small"
                    sx={(theme) => ({
                        color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                    })}
                >
                    {isRTL ? <ArrowForward /> : <ArrowBack />}
                </IconButton>
                <Box
                    component="button"
                    type="button"
                    onClick={handleOpenDetails}
                    disabled={!selectedChat}
                    sx={{
                        minWidth: 0,
                        border: 0,
                        p: 0,
                        m: 0,
                        backgroundColor: "transparent",
                        color: "inherit",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                        cursor: selectedChat ? "pointer" : "default",
                        textAlign: "left",
                    }}
                >
                    {selectedChat?.chat_type === "single" ? (
                        <DecryptedProfileImage
                            imageUrl={headerAvatar}
                            fallback={<Person />}
                            sx={(theme) => ({
                                width: 40,
                                height: 40,
                                backgroundColor:
                                    theme.palette.mode === "dark"
                                        ? "#1d1f1f"
                                        : "#f7f5f3",
                                border: "1px solid",
                                borderColor:
                                    theme.palette.mode === "dark"
                                        ? "#404040"
                                        : "#d4d4d4",
                                color: theme.palette.mode === "dark" ? "#fff" : "#000",
                            })}
                        />
                    ) : (
                        <DecryptedProfileImage
                            imageUrl={headerAvatar}
                            fallback={<Group />}
                            sx={(theme) => ({
                                width: 40,
                                height: 40,
                                backgroundColor:
                                    theme.palette.mode === "dark"
                                        ? "#1d1f1f"
                                        : "#f7f5f3",
                                border: "1px solid",
                                borderColor:
                                    theme.palette.mode === "dark"
                                        ? "#404040"
                                        : "#d4d4d4",
                                color: theme.palette.mode === "dark" ? "#fff" : "#000",
                            })}
                        />
                    )}
                    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", minWidth: 0 }}>
                        <Typography
                            variant="body1"
                            sx={{
                                fontWeight: "600",
                                direction: 'ltr',
                                maxWidth: { xs: 180, sm: 260, md: 360 },
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {headerTitle}
                        </Typography>
                        {subtitle ? (
                            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", textAlign: "left" }}>
                                {subtitle}
                            </Typography>
                        ) : null}
                    </Box>
                </Box>
            </Box>
            <div className="flex flex-row items-center gap-x-2">
                <ChatRoomMoreActionButton
                    chat_type={selectedChat?.chat_type ?? "single"}
                    chat_id={selectedChat?.chat_id ?? ""}
                />
            </div>
        </Box>
    );
}
