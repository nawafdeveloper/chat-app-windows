import { getLocaleFromCookie, isRTLClient } from "../lib/locale-client";
import {
    ArchiveOutlined,
    BlockOutlined,
    DeleteForeverOutlined,
    ExpandMoreOutlined,
    FavoriteBorderOutlined,
    LogoutOutlined,
    MarkChatReadOutlined,
    NotificationsOffOutlined,
    NotificationsOutlined,
    PushPinOutlined,
} from "@mui/icons-material";
import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Divider, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import React, { useState } from "react";
import { useChatMenuActions } from "../hooks/use-chat-menu-actions";

interface Props {
    chat_id: string;
    chat_type: "group" | "single";
    is_archived_chat: boolean;
    is_muted_chat_notifications: boolean;
    is_pinned_chat: boolean;
    is_favourite_chat: boolean;
    is_blocked_chat: boolean;
}

type PreferenceKey =
    | "is_archived_chat"
    | "is_pinned_chat"
    | "is_favourite_chat"
    | "is_blocked_chat";

const menuItemSx = (theme: Theme) => ({
    "&:hover": {
        backgroundColor: theme.palette.mode === "dark" ? "#333" : "#eee",
    },
    borderRadius: 2,
    paddingY: 1,
    paddingX: 1,
});

const iconSx = (theme: Theme) => ({
    color: theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
});

const textSx = (theme: Theme) => ({
    color: theme.palette.mode === "dark" ? "#A5A5A5" : "#636261",
    fontWeight: 500,
    fontSize: "15px",
});

export default function ChatItemMoreButtonMenu({
    chat_id,
    chat_type,
    is_archived_chat,
    is_muted_chat_notifications,
    is_pinned_chat,
    is_favourite_chat,
    is_blocked_chat,
}: Props) {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const {
        isUpdating,
        setChatPreference,
        deleteChatForCurrentUser,
        markChatAsRead,
    } = useChatMenuActions();

    const [pendingAction, setPendingAction] = useState<string | null>(null);
    const [groupError, setGroupError] = useState<string | null>(null);
    const [exitConfirmOpen, setExitConfirmOpen] = useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);

    const closeMenu = () => setAnchorEl(null);
    const handleClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        event.preventDefault();
        setAnchorEl(event.currentTarget);
    };
    const handleClose = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        event.preventDefault();
        closeMenu();
    };
    const handlePreferenceAction =
        (key: PreferenceKey, value: boolean) =>
            async (event: React.MouseEvent<HTMLElement>) => {
                event.stopPropagation();
                event.preventDefault();
                closeMenu();
                await setChatPreference(chat_id, key, value);
            };
    const handleToggleNotifications = async (
        event: React.MouseEvent<HTMLElement>
    ) => {
        event.stopPropagation();
        event.preventDefault();
        closeMenu();
        await setChatPreference(
            chat_id,
            "is_muted_chat_notifications",
            !is_muted_chat_notifications
        );
    };
    const handleMarkRead = async (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        event.preventDefault();
        closeMenu();
        await markChatAsRead(chat_id);
    };
    const handleDeleteChat = async (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        event.preventDefault();
        closeMenu();
        await deleteChatForCurrentUser(chat_id);
    };

    const handleExitGroupClick = (chatId: string, isGroup: boolean) => {
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

    const handleConfirmExitGroup = async (chatId: string, isGroup: boolean, event: React.MouseEvent<HTMLElement>) => {
        if (!chatId || !isGroup) {
            return;
        }

        setPendingAction("exit");
        setGroupError(null);

        try {
            const response = await fetch(`https://web.yahla.org/api/chats/${encodeURIComponent(chatId)}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const payload = await response.json().catch(() => null) as { error?: string } | null;
                throw new Error(payload?.error ?? "Failed to exit group.");
            }

            handleDeleteChat(event);
            setExitConfirmOpen(false);
        } catch (error) {
            setGroupError(error instanceof Error ? error.message : "Failed to exit group.");
        } finally {
            setPendingAction(null);
        }
    };

    const labels = {
        archive: is_archived_chat
            ? isRTL
                ? "إخراج من الأرشيف"
                : "Unarchive chat"
            : isRTL
                ? "أرشفة المحادثة"
                : "Archive chat",
        mute: is_muted_chat_notifications
            ? isRTL
                ? "إلغاء كتم الإشعارات"
                : "Unmute notifications"
            : isRTL
                ? "كتم الإشعارات"
                : "Mute notifications",
        pin: is_pinned_chat
            ? isRTL
                ? "إلغاء تثبيت المحادثة"
                : "Unpin chat"
            : isRTL
                ? "تثبيت المحادثة"
                : "Pin chat",
        read: isRTL ? "تحديد كمقروءة" : "Mark as read",
        favourite: is_favourite_chat
            ? isRTL
                ? "إزالة من المفضلة"
                : "Remove from favourites"
            : isRTL
                ? "إضافة للمفضلة"
                : "Add to favourites",
        exit: isRTL ? "الخروج من المجموعة" : "Exit group",
        block: is_blocked_chat
            ? isRTL
                ? "إلغاء الحظر"
                : "Unblock"
            : isRTL
                ? "حظر"
                : "Block",
        delete: isRTL ? "حذف المحادثة" : "Delete chat",
    };

    return (
        <div>
            <IconButton
                type="button"
                id="more-button"
                size="medium"
                className="chat-hover-action"
                aria-controls={open ? "basic-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={open ? "true" : undefined}
                onClick={handleClick}
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(8px, -50%)",
                    opacity: 0,
                    transition: "all 100ms ease",
                    pointerEvents: "none",
                    "&:hover": {
                        backgroundColor: "transparent",
                    },
                }}
            >
                <ExpandMoreOutlined
                    sx={(theme) => ({
                        color:
                            theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                    })}
                />
            </IconButton>
            <Menu
                id="basic-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                    sx: (theme) => ({
                        backgroundColor:
                            theme.palette.mode === "dark" ? "#222424" : "#ffffff",
                        borderRadius: 3,
                        boxShadow: "0px 4px 20px rgba(0,0,0,0.1)",
                    }),
                }}
                MenuListProps={{
                    "aria-labelledby": "basic-button",
                    sx: {
                        padding: 1,
                    },
                }}
            >
                <MenuItem
                    onClick={handlePreferenceAction(
                        "is_archived_chat",
                        !is_archived_chat
                    )}
                    disabled={isUpdating}
                    sx={menuItemSx}
                >
                    <ListItemIcon>
                        <ArchiveOutlined fontSize="medium" sx={iconSx} />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ sx: textSx }}>
                        {labels.archive}
                    </ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={handleToggleNotifications}
                    disabled={isUpdating}
                    sx={menuItemSx}
                >
                    <ListItemIcon>
                        {is_muted_chat_notifications ? (
                            <NotificationsOutlined fontSize="medium" sx={iconSx} />
                        ) : (
                            <NotificationsOffOutlined
                                fontSize="medium"
                                sx={iconSx}
                            />
                        )}
                    </ListItemIcon>
                    <ListItemText
                        primary={labels.mute}
                        primaryTypographyProps={{ sx: textSx }}
                    />
                </MenuItem>
                <MenuItem
                    onClick={handlePreferenceAction(
                        "is_pinned_chat",
                        !is_pinned_chat
                    )}
                    disabled={isUpdating}
                    sx={menuItemSx}
                >
                    <ListItemIcon>
                        <PushPinOutlined fontSize="medium" sx={iconSx} />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ sx: textSx }}>
                        {labels.pin}
                    </ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={handleMarkRead}
                    disabled={isUpdating}
                    sx={menuItemSx}
                >
                    <ListItemIcon>
                        <MarkChatReadOutlined fontSize="medium" sx={iconSx} />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ sx: textSx }}>
                        {labels.read}
                    </ListItemText>
                </MenuItem>
                <MenuItem
                    onClick={handlePreferenceAction(
                        "is_favourite_chat",
                        !is_favourite_chat
                    )}
                    disabled={isUpdating}
                    sx={menuItemSx}
                >
                    <ListItemIcon>
                        <FavoriteBorderOutlined fontSize="medium" sx={iconSx} />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ sx: textSx }}>
                        {labels.favourite}
                    </ListItemText>
                </MenuItem>
                <Divider />
                {chat_type === "group" ? (
                    <MenuItem onClick={() => handleExitGroupClick(chat_id, chat_type === 'group')} disabled={isUpdating} sx={menuItemSx}>
                        <ListItemIcon>
                            <LogoutOutlined fontSize="medium" sx={iconSx} />
                        </ListItemIcon>
                        <ListItemText primaryTypographyProps={{ sx: textSx }}>
                            {labels.exit}
                        </ListItemText>
                    </MenuItem>
                ) : (
                    <div>
                        <MenuItem
                            onClick={handlePreferenceAction(
                                "is_blocked_chat",
                                !is_blocked_chat
                            )}
                            disabled={isUpdating}
                            sx={menuItemSx}
                        >
                            <ListItemIcon>
                                <BlockOutlined fontSize="medium" sx={iconSx} />
                            </ListItemIcon>
                            <ListItemText primaryTypographyProps={{ sx: textSx }}>
                                {labels.block}
                            </ListItemText>
                        </MenuItem>
                        <MenuItem
                            onClick={handleDeleteChat}
                            disabled={isUpdating}
                            sx={menuItemSx}
                        >
                            <ListItemIcon>
                                <DeleteForeverOutlined
                                    fontSize="medium"
                                    sx={iconSx}
                                />
                            </ListItemIcon>
                            <ListItemText primaryTypographyProps={{ sx: textSx }}>
                                {labels.delete}
                            </ListItemText>
                        </MenuItem>
                    </div>
                )}
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
                        onClick={(e) => void handleConfirmExitGroup(chat_id, chat_type === 'group', e)}
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
        </div>
    );
}
