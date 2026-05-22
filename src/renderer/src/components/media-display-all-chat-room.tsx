import {
    findContactByUserId,
    getContactDisplayName,
} from '../lib/contact-display';
import { phoneValuesMatch } from '../lib/contact-utils';
import { formatFileSize, getFileExtension } from '../lib/files';
import { getLocaleFromCookie, isRTLClient } from '../lib/locale-client';
import { useDecryptedMessageMedia } from '../hooks/use-decrypted-message-media';
import { useDecryptedContacts } from '../hooks/use-decrypted-contacts';
import { useActiveChatStore } from '../store/use-active-chat-store';
import { useDetailedSidebarStore } from '../store/use-detailed-sidebar-store';
import type { Message } from '../types/messages.type';
import DownloadingIcon from '@mui/icons-material/Downloading';
import React, { type SyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react'
import MediaDisplayAllChatRoomHeader from './media-display-all-chat-room-header';
import {
    Box,
    CircularProgress,
    IconButton,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Tooltip,
    Typography,
} from '@mui/material';
import FileIcon from './file-icon';
import { type DetailedSidebarMediaItem, DetailedSidebarMediaTile } from './detailed-sidebar-item-media';

const EMPTY_MESSAGES: Message[] = [];
const MIME_EXTENSION_BY_TYPE: Record<string, string> = {
    "application/msword": "doc",
    "application/pdf": "pdf",
    "application/vnd.ms-excel": "xls",
    "application/vnd.ms-powerpoint": "ppt",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        "pptx",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
    "application/zip": "zip",
    "text/csv": "csv",
    "text/plain": "txt",
};

type DocumentAction = "open" | "download";

type DetailedDocumentItem = {
    id: string;
    mediaUrl: string;
    fileName: string | null;
    sizeBytes?: number | null;
    mimeType?: string | null;
    createdAt: Date;
};

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`media-tabpanel-${index}`}
            aria-labelledby={`media-tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

function isVisualMediaMessage(message: Message) {
    return (
        (message.attached_media === "photo" ||
            message.attached_media === "video") &&
        Boolean(message.media_url || message.media_preview_url)
    );
}

function isDocumentMessage(message: Message) {
    return message.attached_media === "file" && Boolean(message.media_url);
}

function formatMediaMonth(value: Date) {
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const year = value.getFullYear();

    return `${month}/${year}`;
}

function getMimeFileExtension(mimeType?: string | null) {
    if (!mimeType) {
        return "";
    }

    const normalizedMimeType = mimeType.split(";")[0]?.trim().toLowerCase();
    if (!normalizedMimeType) {
        return "";
    }

    return (
        MIME_EXTENSION_BY_TYPE[normalizedMimeType] ??
        normalizedMimeType.split("/").pop() ??
        ""
    );
}

function getDocumentExtension(item: {
    fileName?: string | null;
    mediaUrl?: string | null;
    mimeType?: string | null;
}) {
    return (
        getFileExtension(item.fileName ?? "") ||
        getMimeFileExtension(item.mimeType) ||
        getFileExtension(item.mediaUrl ?? "") ||
        "file"
    ).toLowerCase();
}

function saveMediaUrl(url: string, fileName: string) {
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function DocumentListItem({
    item,
    isRTL,
}: {
    item: DetailedDocumentItem;
    isRTL: boolean;
}) {
    const {
        decryptedUrl,
        mimeType,
        loading,
        error,
        download,
    } = useDecryptedMessageMedia({
        mediaUrl: item.mediaUrl,
        autoDownload: false,
    });
    const [pendingAction, setPendingAction] = useState<DocumentAction | null>(
        null
    );
    const displayFileName =
        item.fileName?.trim() ||
        (isRTL ? "ملف مشفر" : "Encrypted file");
    const extension = getDocumentExtension({
        fileName: item.fileName,
        mediaUrl: item.mediaUrl,
        mimeType: item.mimeType ?? mimeType,
    });
    const fileTypeLabel = extension.toUpperCase();
    const mediaSizeLabel = formatFileSize(item.sizeBytes);
    const isBusy = loading || Boolean(pendingAction);

    const performMediaAction = useCallback(
        (action: DocumentAction, mediaUrl: string) => {
            if (action === "open") {
                window.open(mediaUrl, "_blank", "noopener,noreferrer");
                return;
            }

            saveMediaUrl(mediaUrl, displayFileName);
        },
        [displayFileName]
    );

    useEffect(() => {
        if (!pendingAction || !decryptedUrl) {
            return;
        }

        performMediaAction(pendingAction, decryptedUrl);
        setPendingAction(null);
    }, [decryptedUrl, pendingAction, performMediaAction]);

    useEffect(() => {
        if (pendingAction && error) {
            setPendingAction(null);
        }
    }, [error, pendingAction]);

    const requestMediaAction = async (action: DocumentAction) => {
        if (decryptedUrl) {
            performMediaAction(action, decryptedUrl);
            return;
        }

        setPendingAction(action);
        await download();
    };

    return (
        <ListItem
            disablePadding
            secondaryAction={
                <Tooltip
                    title={isRTL ? "تنزيل" : "Download"}
                    placement="bottom"
                    slotProps={{
                        tooltip: {
                            sx: (theme) => ({
                                backgroundColor:
                                    theme.palette.mode === "dark"
                                        ? "#ffffff"
                                        : "#000000",
                                color:
                                    theme.palette.mode === "dark"
                                        ? "#000000"
                                        : "#ffffff",
                            }),
                        },
                    }}
                >
                    <span>
                        <IconButton
                            edge="end"
                            disabled={isBusy}
                            onClick={(event) => {
                                event.stopPropagation();
                                void requestMediaAction("download");
                            }}
                            sx={(theme) => ({
                                color:
                                    theme.palette.mode === "dark"
                                        ? "#ffffff"
                                        : "#000000",
                            })}
                        >
                            {isBusy && pendingAction === "download" ? (
                                <CircularProgress size={20} />
                            ) : (
                                <DownloadingIcon />
                            )}
                        </IconButton>
                    </span>
                </Tooltip>
            }
            sx={{
                "& + &": {
                    mt: 1,
                },
                "& .MuiListItemSecondaryAction-root": {
                    left: isRTL ? 8 : "auto",
                    right: isRTL ? "auto" : 8,
                },
            }}
        >
            <ListItemButton
                onClick={() => void requestMediaAction("open")}
                sx={(theme) => ({
                    borderRadius: 2,
                    gap: 1.5,
                    minHeight: 72,
                    pl: isRTL ? 7 : 2,
                    pr: isRTL ? 2 : 7,
                    border: "1px solid",
                    borderColor:
                        theme.palette.mode === "dark" ? "#2d3131" : "#e5e0dc",
                    backgroundColor:
                        theme.palette.mode === "dark" ? "#1a1b1b" : "#f7f5f3",
                    "&:hover": {
                        backgroundColor:
                            theme.palette.mode === "dark" ? "#242727" : "#eee8e2",
                    },
                })}
            >
                <ListItemIcon sx={{ minWidth: 44 }}>
                    <FileIcon extension={extension} size={32} />
                </ListItemIcon>
                <ListItemText
                    primary={displayFileName}
                    secondary={`${fileTypeLabel} \u2022 ${mediaSizeLabel}`}
                    primaryTypographyProps={{
                        noWrap: true,
                        sx: {
                            textAlign: isRTL ? "right" : "left",
                            wordBreak: "break-word",
                        },
                    }}
                    secondaryTypographyProps={{
                        noWrap: true,
                        sx: {
                            color: "text.secondary",
                            textAlign: isRTL ? "right" : "left",
                        },
                    }}
                    sx={{ minWidth: 0 }}
                />
            </ListItemButton>
        </ListItem>
    );
}

export default function MediaDisplayAllChatRoom() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const target = useDetailedSidebarStore((state) => state.target);
    const selectedChatId = useActiveChatStore((state) => state.selectedChatId);
    const chats = useActiveChatStore((state) => state.chats);
    const messagesByChatId = useActiveChatStore(
        (state) => state.messagesByChatId
    );
    const { contacts } = useDecryptedContacts();

    const [value, setValue] = useState(0);
    const targetChat =
        target?.chatId
            ? chats.find((chat) => chat.chat_id === target.chatId) ?? null
            : null;
    const targetGroupMember =
        target?.type === "user" && targetChat?.chat_type === "group"
            ? targetChat.group_members?.find(
                  (member) => member.user_id === target.userId
              ) ?? null
            : null;
    const targetMemberPhone = targetGroupMember?.phone_number ?? null;
    const targetProfileChat =
        target?.type === "user"
            ? chats.find((chat) => {
                  if (chat.chat_type !== "single") {
                      return false;
                  }

                  if (chat.recipient_user_id === target.userId) {
                      return true;
                  }

                  if (!targetMemberPhone) {
                      return false;
                  }

                  const chatIdHasMemberPhone = chat.chat_id
                      .split("::")
                      .some((participant) =>
                          phoneValuesMatch(participant, targetMemberPhone)
                      );

                  return (
                      Boolean(
                          chat.contact_phone &&
                              phoneValuesMatch(
                                  chat.contact_phone,
                                  targetMemberPhone
                              )
                      ) ||
                      chatIdHasMemberPhone
                  );
              }) ?? null
            : null;
    const activeChatId =
        target?.type === "user"
            ? targetProfileChat?.chat_id ?? null
            : target?.chatId ?? selectedChatId;
    const messages = activeChatId
        ? messagesByChatId[activeChatId] ?? EMPTY_MESSAGES
        : EMPTY_MESSAGES;

    const mediaItems = useMemo<DetailedSidebarMediaItem[]>(
        () =>
            messages
                .filter(isVisualMediaMessage)
                .sort(
                    (left, right) =>
                        right.created_at.getTime() - left.created_at.getTime()
                )
                .map((message) => ({
                    id: message.message_id,
                    type: message.attached_media === "video" ? "video" : "photo",
                    mediaUrl: message.media_url,
                    previewUrl: message.media_preview_url ?? null,
                    createdAt: message.created_at,
                    senderUserId: message.sender_user_id,
                    senderDisplayName: (() => {
                        const senderContact = findContactByUserId(
                            contacts,
                            message.sender_user_id
                        );

                        return senderContact
                            ? getContactDisplayName(senderContact)
                            : message.sender_user_id;
                    })(),
                })),
        [contacts, messages]
    );

    const documentItems = useMemo<DetailedDocumentItem[]>(
        () =>
            messages
                .filter(isDocumentMessage)
                .sort(
                    (left, right) =>
                        right.created_at.getTime() - left.created_at.getTime()
                )
                .map((message) => ({
                    id: message.message_id,
                    mediaUrl: message.media_url ?? "",
                    fileName:
                        message.client_local_media_name ??
                        message.media_file_name ??
                        null,
                    sizeBytes:
                        message.media_size_bytes ??
                        message.client_local_media_size ??
                        null,
                    mimeType: message.client_local_media_mime_type ?? null,
                    createdAt: message.created_at,
                })),
        [messages]
    );

    const groupedMediaItems = useMemo(() => {
        const groups = new Map<
            string,
            {
                month: string;
                items: DetailedSidebarMediaItem[];
            }
        >();

        for (const item of mediaItems) {
            const month = formatMediaMonth(item.createdAt);
            const group = groups.get(month);

            if (group) {
                group.items.push(item);
            } else {
                groups.set(month, {
                    month,
                    items: [item],
                });
            }
        }

        return Array.from(groups.values());
    }, [mediaItems]);

    const handleChange = (event: SyntheticEvent, newValue: number) => {
        event.preventDefault();
        setValue(newValue);
    };

    return (
        <div className="md:flex hidden flex-col w-full h-full bg-white dark:bg-[#161717] relative overflow-hidden border-t dark:border-neutral-700 border-neutral-300">
            <div
                className={`flex flex-col space-y-4 h-full max-h-full min-h-full w-full ${isRTL ? "border-r" : "border-l"
                    } dark:border-neutral-700 border-neutral-300 overflow-y-auto`}
            >
                <MediaDisplayAllChatRoomHeader
                    value={value}
                    handleChange={handleChange}
                />
                <CustomTabPanel value={value} index={0}>
                    {groupedMediaItems.length > 0 ? (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 3,
                                width: '100%',
                            }}
                        >
                            {groupedMediaItems.map((group) => (
                                <Box key={group.month}>
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            mb: 1,
                                            color: 'text.secondary',
                                            direction: 'ltr',
                                            fontWeight: 600,
                                            textAlign: 'left',
                                        }}
                                    >
                                        {group.month}
                                    </Typography>
                                    <Box
                                        sx={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                                            gap: 1,
                                            width: '100%',
                                        }}
                                    >
                                        {group.items.map((item) => (
                                            <DetailedSidebarMediaTile
                                                key={item.id}
                                                item={item}
                                            />
                                        ))}
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    ) : (
                        <Typography
                            variant="body2"
                            sx={{
                                mt: 4,
                                color: 'text.secondary',
                                textAlign: 'center',
                            }}
                        >
                            {isRTL ? "لا يوجد وسائط" : "No media"}
                        </Typography>
                    )}
                </CustomTabPanel>
                <CustomTabPanel value={value} index={1}>
                    {documentItems.length > 0 ? (
                        <List
                            disablePadding
                            sx={{
                                width: "100%",
                            }}
                        >
                            {documentItems.map((item) => (
                                <DocumentListItem
                                    key={item.id}
                                    item={item}
                                    isRTL={isRTL}
                                />
                            ))}
                        </List>
                    ) : (
                        <Typography
                            variant="body2"
                            sx={{
                                mt: 4,
                                color: 'text.secondary',
                                textAlign: 'center',
                            }}
                        >
                            {isRTL ? "لا يوجد مستندات" : "No documents"}
                        </Typography>
                    )}
                </CustomTabPanel>
            </div>
        </div>
    )
}
