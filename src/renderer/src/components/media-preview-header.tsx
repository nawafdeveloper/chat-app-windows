import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { authClient } from '../lib/auth-client';
import useMediaPreviewStore from '../store/media-preview-store';
import { CloseOutlined, FileDownloadOutlined, Person, PushPin, PushPinOutlined, Shortcut, Star, StarOutlined, ZoomIn, ZoomOut } from '@mui/icons-material'
import { Avatar, Box, CircularProgress, IconButton, Tooltip, Typography } from '@mui/material'
import React, { useState } from 'react'
import { useActiveChatStore } from '../store/use-active-chat-store';
import { useMessageActions } from '../hooks/use-message-actions';
import { createReplyMessageFromMessage } from '../lib/message-reply';
import { fetchAndDecryptMessageMedia } from '../lib/message-media-upload';
import { parseManagedMessageMediaUrl } from '../lib/message-media-url';

type Props = {
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    maxZoom: number;
    minZoom: number;
}

type ActionButton = {
    id: string;
    tooltip: string;
    icon: React.ElementType | React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
}

export default function MediaPreviewHeader({ zoom, onZoomIn, onZoomOut, maxZoom, minZoom }: Props) {
    const { data: session } = authClient.useSession();
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const [isDownloading, setIsDownloading] = useState(false);

    const {
        closePreview,
        senderUserId,
        senderDisplayName,
        createdAt,
        chatId,
        messageId,
        mediaUrl,
    } = useMediaPreviewStore();
    const selectedChatId = useActiveChatStore((state) => state.selectedChatId);
    const messagesByChatId = useActiveChatStore((state) => state.messagesByChatId);
    const setReplyDraft = useActiveChatStore((state) => state.setReplyDraft);
    const { starMessage, pinMessage } = useMessageActions();
    const resolvedChatId = chatId || selectedChatId;
    const previewMessage =
        resolvedChatId && messageId
            ? messagesByChatId[resolvedChatId]?.find(
                (message) => message.message_id === messageId
            ) ?? null
            : null;
    const currentUserId = session?.user.id ?? null;
    const isStarredByCurrentUser = Boolean(
        currentUserId && previewMessage?.user_ids_star_it?.includes(currentUserId)
    );
    const isPinnedByCurrentUser = Boolean(
        currentUserId && previewMessage?.user_ids_pin_it?.includes(currentUserId)
    );
    const senderLabel =
        senderUserId && senderUserId === session?.user.id
            ? isRTL
                ? "أنت"
                : "You"
            : senderDisplayName ?? senderUserId;

    const downloadFileName =
        previewMessage?.media_file_name ||
        `${previewMessage?.attached_media === "video" ? "video" : "photo"}-${messageId ?? "media"}`;

    const handleReply = () => {
        if (!previewMessage || !resolvedChatId) {
            return;
        }

        setReplyDraft(resolvedChatId, createReplyMessageFromMessage(previewMessage));
        closePreview();
    };

    const triggerDownload = (href: string, shouldRevoke = false) => {
        const anchor = document.createElement("a");
        anchor.href = href;
        anchor.download = downloadFileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();

        if (shouldRevoke) {
            window.setTimeout(() => URL.revokeObjectURL(href), 1000);
        }
    };

    const handleSaveAs = async () => {
        const targetMediaUrl = previewMessage?.media_url ?? mediaUrl;

        if (!targetMediaUrl || isDownloading) {
            return;
        }

        const managedMedia = parseManagedMessageMediaUrl(targetMediaUrl);
        if (!managedMedia) {
            triggerDownload(targetMediaUrl);
            return;
        }

        setIsDownloading(true);
        try {
            const blob = await fetchAndDecryptMessageMedia(managedMedia.objectKey);
            const objectUrl = URL.createObjectURL(blob);
            triggerDownload(objectUrl, true);
        } finally {
            setIsDownloading(false);
        }
    };

    const actionButtons: ActionButton[] = [
        {
            id: '1',
            tooltip: isRTL ? 'تصغير' : 'Zoom out',
            icon: ZoomOut,
            onClick: onZoomOut,
            disabled: zoom <= minZoom,
        },
        {
            id: '2',
            tooltip: isRTL ? 'تكبير' : 'Zoom in',
            icon: ZoomIn,
            onClick: onZoomIn,
            disabled: zoom >= maxZoom,
        },
        {
            id: '4',
            tooltip: isRTL ? 'رد' : 'Reply',
            icon: Shortcut,
            onClick: handleReply,
            disabled: !previewMessage || !resolvedChatId,
        },
        {
            id: '5',
            tooltip: isRTL ? 'نجمة' : 'Star',
            icon: isStarredByCurrentUser ? Star : StarOutlined,
            onClick: () => {
                if (previewMessage) {
                    void starMessage(previewMessage, !isStarredByCurrentUser);
                }
            },
            disabled: !previewMessage,
        },
        {
            id: '6',
            tooltip: isRTL ? 'تثبيت' : 'Pin',
            icon: isPinnedByCurrentUser ? PushPin : PushPinOutlined,
            onClick: () => {
                if (previewMessage) {
                    void pinMessage(previewMessage, !isPinnedByCurrentUser);
                }
            },
            disabled: !previewMessage,
        },
        {
            id: '9',
            tooltip: isRTL ? 'حفظ كـ' : 'Save as',
            icon: isDownloading ? <CircularProgress size={22} color="inherit" /> : FileDownloadOutlined,
            onClick: () => void handleSaveAs(),
            disabled: isDownloading || !(previewMessage?.media_url ?? mediaUrl),
        },
        {
            id: '10',
            tooltip: isRTL ? 'إغلاق' : 'Close',
            icon: CloseOutlined,
            onClick: () => closePreview(),
        },
    ];

    return (
        <Box
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
                color: theme.palette.mode === "dark" ? "#FFFFFF" : "#000000"
            })}
        >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar
                    sx={(theme) => ({
                        width: 40,
                        height: 40,
                        backgroundColor:
                            theme.palette.mode === "dark" ? "#1d1f1f" : "#f7f5f3",
                        border: "1px solid",
                        borderColor:
                            theme.palette.mode === "dark" ? "#404040" : "#d4d4d4",
                        color: theme.palette.mode === "dark" ? "#fff" : "#000",
                    })}
                >
                    <Person />
                </Avatar>
                <span className='flex flex-col items-start justify-start'>
                    <Typography
                        variant="body1"
                        sx={{
                            fontWeight: "600"
                        }}
                    >
                        {senderLabel}
                    </Typography>
                    <Typography
                        variant="caption"
                        sx={{
                            fontWeight: "600"
                        }}
                    >
                        {createdAt}
                    </Typography>
                </span>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {actionButtons.map((item) => (
                    <Tooltip
                        key={item.id}
                        title={item.tooltip}
                        placement="bottom"
                        slotProps={{
                            tooltip: {
                                sx: (theme) => ({
                                    backgroundColor:
                                        theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                                    color: theme.palette.mode === "dark" ? "#000000" : "#ffffff",
                                }),
                            },
                        }}
                    >
                        <IconButton
                            size="medium"
                            component="span"
                            disabled={item.disabled}
                            sx={(theme) => ({
                                color: theme.palette.mode === "dark" ? "#ffffff" : "#000000"
                            })}
                            onClick={item.onClick}
                        >
                            {React.isValidElement(item.icon)
                                ? item.icon
                                : React.createElement(item.icon as React.ElementType)
                            }
                        </IconButton>
                    </Tooltip>
                ))}
            </Box>
        </Box>
    )
}
