import { useCryptoKeys } from "../context/crypto";
import { useDecryptedContacts } from "../hooks/use-decrypted-contacts";
import { useSendChatMessage } from "../hooks/use-send-chat-message";
import { getContactDisplayName } from "../lib/contact-display";
import { getLocaleFromCookie, isRTLClient } from "../lib/locale-client";
import { useMediaAttachmentStore } from "../store/media-attachment-store";
import { useActiveChatStore } from "../store/use-active-chat-store";
import {
    AddOutlined,
    CalendarMonth,
    CameraAlt,
    Close,
    CloseOutlined,
    Collections,
    Description,
    Headphones,
    Person,
    Poll,
    SearchOutlined,
} from "@mui/icons-material";
import {
    Alert,
    Box,
    CircularProgress,
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
    Modal,
    Snackbar,
    TextField,
    Typography,
    Zoom,
} from "@mui/material";
import React, { useMemo, useRef, useState } from "react";
import DecryptedProfileImage from "./decrypted-profile-image";

export default function ChatRoomInputAttachButton() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const { isReady } = useCryptoKeys();
    const selectedChatId = useActiveChatStore((state) => state.selectedChatId);
    const { contacts, isLoading: contactsLoading } = useDecryptedContacts();
    const { sendAttachment, sendContact } = useSendChatMessage();
    const openMediaAttachment = useMediaAttachmentStore(
        (state) => state.openMediaAttachment
    );

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [contactDialogOpen, setContactDialogOpen] = useState(false);
    const [contactSearchQuery, setContactSearchQuery] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const open = Boolean(anchorEl);
    const documentInputRef = useRef<HTMLInputElement>(null);
    const mediaInputRef = useRef<HTMLInputElement>(null);
    const audioInputRef = useRef<HTMLInputElement>(null);
    const contactSearchInputRef = useRef<HTMLInputElement>(null);

    const sortedContacts = useMemo(
        () =>
            [...contacts].sort((left, right) =>
                getContactDisplayName(left).localeCompare(
                    getContactDisplayName(right),
                    locale ?? undefined
                )
            ),
        [contacts, locale]
    );
    const visibleContacts = useMemo(() => {
        const query = contactSearchQuery.trim().toLowerCase();

        if (!query) {
            return sortedContacts;
        }

        return sortedContacts.filter((contact) => {
            const contactName = getContactDisplayName(contact).toLowerCase();
            const contactNumber = contact.contact_number.toLowerCase();

            return contactName.includes(query) || contactNumber.includes(query);
        });
    }, [contactSearchQuery, sortedContacts]);

    const handleClearContactSearch = () => {
        setContactSearchQuery("");
        contactSearchInputRef.current?.blur();
    };

    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        event.preventDefault();
        setAnchorEl(event.currentTarget);
    };

    const handleClose = (event?: React.SyntheticEvent) => {
        event?.stopPropagation();
        event?.preventDefault();
        setAnchorEl(null);
    };

    const ensureAttachmentReady = () => {
        if (!selectedChatId) {
            setErrorMessage(isRTL ? "اختر محادثة أولاً" : "Select a chat first.");
            return false;
        }

        if (!isReady) {
            setErrorMessage(
                isRTL
                    ? "افتح مفاتيح التشفير أولاً لإرسال المرفقات"
                    : "Unlock your encryption keys first to send attachments."
            );
            return false;
        }

        return true;
    };

    const openPicker = (
        event: React.MouseEvent<HTMLElement>,
        ref: React.RefObject<HTMLInputElement | null>
    ) => {
        event.stopPropagation();
        event.preventDefault();

        if (!ensureAttachmentReady()) {
            handleClose();
            return;
        }

        setAnchorEl(null);
        window.setTimeout(() => ref.current?.click(), 0);
    };

    const sendSelectedFiles = async ({
        files,
        resolveAttachedMedia,
    }: {
        files: FileList | null;
        resolveAttachedMedia: (
            file: File
        ) => "photo" | "video" | "voice" | "file";
    }) => {
        if (!files?.length || !ensureAttachmentReady()) {
            return;
        }

        setIsSending(true);
        setErrorMessage(null);

        try {
            for (const file of Array.from(files)) {
                const sent = await sendAttachment({
                    file,
                    attachedMedia: resolveAttachedMedia(file),
                });

                if (!sent) {
                    throw new Error(`Failed to send ${file.name}`);
                }
            }
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Failed to send attachment."
            );
        } finally {
            setIsSending(false);
        }
    };

    const previewSelectedMedia = (files: FileList | null) => {
        if (!files?.length || !selectedChatId || !ensureAttachmentReady()) {
            return;
        }

        const file = Array.from(files).find(
            (item) => item.type.startsWith("image/") || item.type.startsWith("video/")
        );

        if (!file) {
            setErrorMessage(
                isRTL
                    ? "\u0627\u062e\u062a\u0631 \u0635\u0648\u0631\u0629 \u0623\u0648 \u0641\u064a\u062f\u064a\u0648."
                    : "Choose an image or video."
            );
            return;
        }

        openMediaAttachment({
            chatId: selectedChatId,
            file,
            mediaType: file.type.startsWith("video/") ? "video" : "photo",
        });
    };

    const handleContactShare = async (contactId: string) => {
        const selectedContact =
            contacts.find((contact) => contact.contact_id === contactId) ?? null;

        if (!selectedContact || !ensureAttachmentReady()) {
            return;
        }

        setIsSending(true);
        setErrorMessage(null);

        try {
            const sent = await sendContact({ contact: selectedContact });
            if (!sent) {
                throw new Error("Failed to share contact.");
            }
            setContactDialogOpen(false);
        } catch (error) {
            setErrorMessage(
                error instanceof Error ? error.message : "Failed to share contact."
            );
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div>
            <IconButton
                id="more-button"
                component="span"
                size="medium"
                className="chat-hover-action"
                disabled={isSending}
                aria-controls={open ? "attachment-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
                onClick={handleClick}
            >
                <AddOutlined />
            </IconButton>
            <Menu
                id="attachment-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={() => handleClose()}
                anchorOrigin={{
                    vertical: "top",
                    horizontal: "center",
                }}
                transformOrigin={{
                    vertical: "bottom",
                    horizontal: "center",
                }}
                PaperProps={{
                    sx: (theme) => ({
                        backgroundColor:
                            theme.palette.mode === "dark" ? "#222424" : "#ffffff",
                        borderRadius: 3,
                        boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
                        mt: -4,
                    }),
                }}
                MenuListProps={{
                    "aria-labelledby": "more-button",
                    sx: {
                        padding: 1,
                    },
                }}
            >
                <MenuItem
                    onClick={(event) => openPicker(event, documentInputRef)}
                    sx={(theme) => ({
                        "&:hover": {
                            backgroundColor: theme.palette.mode === "dark" ? "#333" : "#eee",
                        },
                        borderRadius: 2,
                        paddingY: 1,
                        paddingX: 1,
                    })}
                >
                    <ListItemIcon>
                        <Description
                            fontSize="medium"
                            sx={{
                                color: "#7F66FF",
                            }}
                        />
                    </ListItemIcon>
                    <ListItemText
                        primaryTypographyProps={{
                            sx: {
                                fontWeight: 500,
                                fontSize: "15px",
                            },
                        }}
                    >
                        {isRTL ? "مستند" : "Document"}
                    </ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={(event) => openPicker(event, mediaInputRef)}
                    sx={(theme) => ({
                        "&:hover": {
                            backgroundColor: theme.palette.mode === "dark" ? "#333" : "#eee",
                        },
                        borderRadius: 2,
                        paddingY: 1,
                        paddingX: 1,
                    })}
                >
                    <ListItemIcon>
                        <Collections
                            fontSize="medium"
                            sx={{
                                color: "#007BFC",
                            }}
                        />
                    </ListItemIcon>
                    <ListItemText
                        primaryTypographyProps={{
                            sx: {
                                fontWeight: 500,
                                fontSize: "15px",
                            },
                        }}
                    >
                        {isRTL ? "فيديوهات و صور" : "Photos & videos"}
                    </ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={(event) => openPicker(event, audioInputRef)}
                    sx={(theme) => ({
                        "&:hover": {
                            backgroundColor: theme.palette.mode === "dark" ? "#333" : "#eee",
                        },
                        borderRadius: 2,
                        paddingY: 1,
                        paddingX: 1,
                    })}
                >
                    <ListItemIcon>
                        <Headphones
                            fontSize="medium"
                            sx={{
                                color: "#FA6533",
                            }}
                        />
                    </ListItemIcon>
                    <ListItemText
                        primaryTypographyProps={{
                            sx: {
                                fontWeight: 500,
                                fontSize: "15px",
                            },
                        }}
                    >
                        {isRTL ? "صوتية" : "Audio"}
                    </ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();

                        if (!ensureAttachmentReady()) {
                            handleClose();
                            return;
                        }

                        setAnchorEl(null);
                        setContactDialogOpen(true);
                    }}
                    sx={(theme) => ({
                        "&:hover": {
                            backgroundColor: theme.palette.mode === "dark" ? "#333" : "#eee",
                        },
                        borderRadius: 2,
                        paddingY: 1,
                        paddingX: 1,
                    })}
                >
                    <ListItemIcon>
                        <Person
                            fontSize="medium"
                            sx={{
                                color: "#009DE2",
                            }}
                        />
                    </ListItemIcon>
                    <ListItemText
                        primaryTypographyProps={{
                            sx: {
                                fontWeight: 500,
                                fontSize: "15px",
                            },
                        }}
                    >
                        {isRTL ? "جهة إتصال" : "Contact"}
                    </ListItemText>
                </MenuItem>
            </Menu>
            <input
                ref={documentInputRef}
                type="file"
                hidden
                multiple
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,.rar,.7z,.csv"
                onChange={async (event) => {
                    await sendSelectedFiles({
                        files: event.target.files,
                        resolveAttachedMedia: () => "file",
                    });
                    event.target.value = "";
                }}
            />
            <input
                ref={mediaInputRef}
                type="file"
                hidden
                accept="image/*,video/*"
                onChange={(event) => {
                    previewSelectedMedia(event.target.files);
                    event.target.value = "";
                }}
            />
            <input
                ref={audioInputRef}
                type="file"
                hidden
                multiple
                accept="audio/*"
                onChange={async (event) => {
                    await sendSelectedFiles({
                        files: event.target.files,
                        resolveAttachedMedia: () => "voice",
                    });
                    event.target.value = "";
                }}
            />
            <Modal
                open={contactDialogOpen}
                onClose={() => setContactDialogOpen(false)}
                closeAfterTransition
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Zoom in={contactDialogOpen} timeout={300}>
                    <Box
                        sx={(theme) => ({
                            backgroundColor:
                                theme.palette.mode === "dark" ? "#161717" : "#FFFFFF",
                            boxShadow: 0,
                            p: 0,
                            borderRadius: "18px",
                            width: "440px",
                            marginY: "auto",
                            height: "100%",
                            maxHeight: "calc(100vh - 200px)",
                            overflow: "hidden",
                            position: "relative",
                        })}
                    >
                        <div className="flex flex-row items-center gap-x-3 p-2">
                            <IconButton
                                type="button"
                                onClick={() => setContactDialogOpen(false)}
                                disabled={isSending}
                            >
                                <Close />
                            </IconButton>
                            <Typography>
                                {isRTL ? "مشاركة جهة اتصال" : "Share contact"}
                            </Typography>
                        </div>
                        <div className="px-5">
                            <TextField
                                hiddenLabel
                                id="filled-contact-search-bar"
                                variant="filled"
                                size="small"
                                placeholder={
                                    isRTL
                                        ? "إبحث عن إسم أو رقم هاتف"
                                        : "Search name or number"
                                }
                                fullWidth
                                value={contactSearchQuery}
                                onChange={(event) =>
                                    setContactSearchQuery(event.target.value)
                                }
                                inputRef={contactSearchInputRef}
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
                                    endAdornment: contactSearchQuery ? (
                                        <InputAdornment position="end">
                                            <IconButton
                                                onClick={handleClearContactSearch}
                                                size="small"
                                            >
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
                                {isRTL
                                    ? "جهات الإتصال"
                                    : "Contacts"}
                            </Typography>
                        </div>
                        <>
                    {contactsLoading && sortedContacts.length === 0 ? (
                        <div className="flex h-[83%] items-center justify-center px-5">
                            <CircularProgress size={26} />
                        </div>
                    ) : visibleContacts.length === 0 ? (
                        <Typography sx={{ px: 3, py: 2, color: "text.secondary" }}>
                            {isRTL
                                ? "لا توجد جهات اتصال متاحة للمشاركة"
                                : "No contacts available."}
                        </Typography>
                    ) : (
                        <List
                            sx={{
                                bgcolor: "transparent",
                                overflowY: "scroll",
                                height: "83%",
                                paddingX: "20px",
                            }}
                        >
                            {visibleContacts.map((contact) => (
                                <ListItem disablePadding key={contact.contact_id}>
                                    <ListItemButton
                                        disabled={isSending}
                                        onClick={() =>
                                            void handleContactShare(contact.contact_id)
                                        }
                                        sx={(theme) => ({
                                            display: "flex",
                                            flexDirection: isRTL ? "row-reverse" : "row",
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
                                        })}
                                    >
                                        <div className="flex flex-row items-center">
                                            <ListItemAvatar>
                                                <DecryptedProfileImage
                                                    imageUrl={contact.contact_avatar ?? ""}
                                                    fallback={<Person />}
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
                                                primary={getContactDisplayName(contact)}
                                                secondary={contact.contact_number}
                                                sx={{
                                                    "& .MuiListItemText-secondary": {
                                                        color: (theme) =>
                                                            theme.palette.mode === "dark"
                                                                ? "#A5A5A5"
                                                                : "#636261",
                                                    },
                                                    overflow: "hidden",
                                                }}
                                                secondaryTypographyProps={{
                                                    noWrap: true,
                                                    sx: {
                                                        overflow: "hidden",
                                                        display: "block",
                                                        maxWidth: "100%",
                                                    },
                                                }}
                                            />
                                        </div>
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    )}
                        </>
                    </Box>
                </Zoom>
            </Modal>
            <Snackbar
                open={Boolean(errorMessage)}
                autoHideDuration={4000}
                onClose={() => setErrorMessage(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
            >
                <Alert
                    onClose={() => setErrorMessage(null)}
                    severity="error"
                    variant="filled"
                >
                    {errorMessage}
                </Alert>
            </Snackbar>
        </div>
    );
}
