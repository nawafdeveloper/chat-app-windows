import { getLocaleFromCookie, isRTLClient } from "../lib/locale-client";
import {
    Close,
    CloseOutlined,
    Group,
    Person,
    SearchOutlined,
    Send,
} from "@mui/icons-material";
import {
    Box,
    Checkbox,
    CircularProgress,
    IconButton,
    InputAdornment,
    List,
    ListItem,
    ListItemAvatar,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Modal,
    TextField,
    Typography,
    Zoom,
} from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useActiveChatStore } from "../store/use-active-chat-store";
import { authClient } from "../lib/auth-client";
import {
    getChatDisplayName,
    resolveDirectChatPartner,
} from "../lib/chat-utils";
import { isManagedProfileImageUrl } from "../lib/profile-image-url";
import { useDecryptedContacts } from "../hooks/use-decrypted-contacts";
import {
    getContactDisplayName,
    resolveDirectChatContact,
} from "../lib/contact-display";
import { canViewProfilePicture } from "../lib/profile-picture-privacy";
import DecryptedProfileImage from "./decrypted-profile-image";

type Props = {
    open: boolean;
    onClose: () => void;
    onForward: (chatIds: string[]) => void | Promise<void>;
    loading?: boolean;
    sourceCount?: number;
};

export default function ChatRoomForwardButton({
    open,
    onClose,
    onForward,
    loading = false,
    sourceCount = 1,
}: Props) {
    const { data: session } = authClient.useSession();
    const chats = useActiveChatStore((state) => state.chats);
    const { contacts } = useDecryptedContacts();
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const currentPhone = (session?.user as { phoneNumber?: string | null } | undefined)
        ?.phoneNumber ?? null;

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedChatsToForward, setSelectedChatsToForward] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!open) {
            setSearchQuery("");
            setSelectedChatsToForward([]);
        }
    }, [open]);

    const handleClear = () => {
        setSearchQuery("");
        inputRef.current?.blur();
    };

    const chatItems = useMemo(
        () =>
            chats.map((chat) => {
                const directContact = resolveDirectChatContact(
                    chat,
                    contacts,
                    currentPhone
                );
                const contactPhone =
                    chat.chat_type === "single"
                        ? directContact?.contact_number ??
                          chat.contact_phone ??
                          resolveDirectChatPartner(chat.chat_id, currentPhone) ??
                          chat.chat_id
                        : "";
                const title =
                    chat.chat_type === "single" && directContact
                        ? getContactDisplayName(directContact)
                        : getChatDisplayName(chat, currentPhone);
                const canShowDirectAvatar =
                    chat.chat_type === "single" &&
                    (chat.recipient_profile_picture_visible ??
                        canViewProfilePicture(
                            chat.recipient_who_can_see_profile_picture,
                            Boolean(directContact)
                        ));
                const directContactAvatar =
                    directContact?.contact_avatar &&
                    !isManagedProfileImageUrl(directContact.contact_avatar)
                        ? directContact.contact_avatar
                        : "";
                const avatarSrc =
                    chat.chat_type === "single"
                        ? canShowDirectAvatar
                            ? chat.avatar || directContactAvatar
                            : ""
                        : chat.avatar;
                const footerLabel =
                    chat.chat_type === "single"
                        ? directContact
                            ? getContactDisplayName(directContact)
                            : contactPhone
                        : title;

                return {
                    chat,
                    title,
                    contactPhone,
                    avatarSrc,
                    footerLabel,
                };
            }),
        [chats, contacts, currentPhone]
    );

    const visibleChatItems = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        if (!query) {
            return chatItems;
        }

        return chatItems.filter(({ chat, title, contactPhone }) =>
            [title, contactPhone, chat.chat_id]
                .filter(Boolean)
                .some((value) => value.toLowerCase().includes(query))
        );
    }, [chatItems, searchQuery]);

    const footerLabelByChatId = useMemo(
        () =>
            new Map(
                chatItems.map((item) => [item.chat.chat_id, item.footerLabel])
            ),
        [chatItems]
    );
    const selectedChatLabels = selectedChatsToForward.map(
        (chatId) => footerLabelByChatId.get(chatId) ?? chatId
    );

    const handleSubmit = async () => {
        if (selectedChatsToForward.length === 0 || loading) {
            return;
        }

        await onForward(selectedChatsToForward);
    };

    const title =
        sourceCount > 1
            ? isRTL
                ? "إعادة توجيه الرسائل إلى"
                : "Forward messages to"
            : isRTL
              ? "إعادة التوجيه إلى"
              : "Forward message to";

    return (
        <Modal
            open={open}
            onClose={loading ? undefined : onClose}
            closeAfterTransition
            sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            <Zoom in={open} timeout={300}>
                <Box
                    sx={(theme) => ({
                        backgroundColor:
                            theme.palette.mode === "dark" ? "#161717" : "#FFFFFF",
                        boxShadow: 0,
                        p: 0,
                        borderRadius: "18px",
                        width: "440px",
                        maxWidth: "calc(100vw - 24px)",
                        marginY: "auto",
                        height: "100%",
                        maxHeight: "calc(100vh - 200px)",
                        overflow: "hidden",
                        position: "relative",
                    })}
                >
                    <div className="flex flex-row items-center gap-x-3 p-2">
                        <IconButton onClick={onClose} disabled={loading}>
                            <Close />
                        </IconButton>
                        <Typography>{title}</Typography>
                    </div>
                    <div className="px-5">
                        <TextField
                            hiddenLabel
                            id="filled-search-bar"
                            variant="filled"
                            size="small"
                            placeholder={
                                isRTL
                                    ? "إبحث عن رقم أو جهة إتصال"
                                    : "Search name or number"
                            }
                            fullWidth
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            inputRef={inputRef}
                            disabled={loading}
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
                                endAdornment: searchQuery ? (
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
                    </div>
                    <div className="my-5 px-6">
                        <Typography
                            variant="caption"
                            sx={{
                                fontWeight: 600,
                                color: (theme) =>
                                    theme.palette.mode === "dark"
                                        ? "#A5A5A5"
                                        : "#636261",
                                fontSize: 14,
                            }}
                        >
                            {isRTL ? "المحادثات الأخيرة" : "Recent chats"}
                        </Typography>
                    </div>
                    <List
                        sx={{
                            bgcolor: "transparent",
                            overflowY: "auto",
                            height: "83%",
                            paddingX: "20px",
                            paddingBottom: selectedChatsToForward.length > 0 ? 10 : 0,
                        }}
                    >
                        {visibleChatItems.map(
                            ({ chat: item, title, contactPhone, avatarSrc }) => (
                                <ListItem disablePadding key={item.chat_id}>
                                    <ListItemButton
                                        disabled={loading}
                                        onClick={() =>
                                            setSelectedChatsToForward((prev) =>
                                                prev.includes(item.chat_id)
                                                    ? prev.filter(
                                                          (id) => id !== item.chat_id
                                                      )
                                                    : [...prev, item.chat_id]
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
                                                boxShadow:
                                                    "0px 4px 20px rgba(0,0,0,0)",
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
                                        <ListItemIcon sx={{ minWidth: 0 }}>
                                            <Checkbox
                                                edge="start"
                                                checked={selectedChatsToForward.includes(
                                                    item.chat_id
                                                )}
                                                tabIndex={-1}
                                                disableRipple
                                                sx={{
                                                    "&.Mui-checked": {
                                                        color: "#25D366",
                                                    },
                                                }}
                                            />
                                        </ListItemIcon>
                                        <div className="flex flex-row items-center">
                                            <ListItemAvatar>
                                                <DecryptedProfileImage
                                                    imageUrl={avatarSrc}
                                                    fallback={
                                                        item.chat_type === "single" ? (
                                                            <Person />
                                                        ) : (
                                                            <Group />
                                                        )
                                                    }
                                                    sx={(theme) => ({
                                                        width: 45,
                                                        height: 45,
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
                                                primary={title}
                                                sx={{
                                                    "& .MuiListItemText-secondary": {
                                                        color: (theme) =>
                                                            theme.palette.mode === "dark"
                                                                ? "#A5A5A5"
                                                                : "#636261",
                                                    },
                                                    overflow: "hidden",
                                                }}
                                                secondary={
                                                    item.chat_type === "single"
                                                        ? contactPhone
                                                        : item.last_message_context
                                                }
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
                                        </div>
                                    </ListItemButton>
                                </ListItem>
                            )
                        )}
                    </List>
                    <AnimatePresence>
                        {selectedChatsToForward.length > 0 && (
                            <motion.div
                                initial={{ y: 80, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 80, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className="absolute bottom-0 left-0 right-0 z-10 flex flex-row items-center justify-between bg-[#F0F0F0] px-4 py-3 dark:bg-[#2B2C2C]"
                            >
                                <span
                                    style={{
                                        display: "block",
                                        maxWidth: "70%",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                    }}
                                >
                                    {selectedChatLabels.join(", ")}
                                </span>

                                <IconButton
                                    size="medium"
                                    disabled={loading}
                                    onClick={handleSubmit}
                                    sx={{
                                        backgroundColor: "#25D366",
                                        color: "#161717",
                                        "&:hover": {
                                            backgroundColor: "#25D366",
                                            color: "#161717",
                                        },
                                        "&.Mui-disabled": {
                                            backgroundColor: "rgba(37,211,102,0.45)",
                                        },
                                    }}
                                >
                                    {loading ? (
                                        <CircularProgress size={22} color="inherit" />
                                    ) : (
                                        <Send className={`${isRTL ? "rotate-180" : ""}`} />
                                    )}
                                </IconButton>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </Box>
            </Zoom>
        </Modal>
    );
}
