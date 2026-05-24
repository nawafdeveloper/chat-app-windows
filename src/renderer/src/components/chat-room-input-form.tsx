import {
    CloseOutlined,
    DeleteOutlined,
    Mic,
    MicNoneOutlined,
    Pause,
    PlayArrow,
    Send,
} from "@mui/icons-material";
import {
    Box,
    IconButton,
    InputAdornment,
    Skeleton,
    TextField,
    Typography,
} from "@mui/material";
import React, { useEffect, useMemo, useRef, useState } from "react";
import ChatRoomInputAttachButton from "./chat-room-input-attach-button";
import ChatRoomInputEmojiButton from "./chat-room-input-emoji-button";
import RecordTimer from "./record-timer";
import {
    useVoiceVisualizer,
    VoiceVisualizer,
} from "react-voice-visualizer";
import { getLocaleFromCookie, isRTLClient } from "../lib/locale-client";
import { useActiveChatStore } from "../store/use-active-chat-store";
import { useSendChatMessage } from "../hooks/use-send-chat-message";
import { useChatTyping } from "../hooks/use-chat-typing";
import { authClient } from "../lib/auth-client";
import { useDecryptedContacts } from "../hooks/use-decrypted-contacts";
import { findContactByUserId, getContactDisplayName } from "../lib/contact-display";
import { getReplyMessageLabel } from "../lib/message-reply";
import { findFirstUrl, splitTextByUrls } from "../lib/url-links";
import type { OpenGraphData } from "../types/messages.type";

const getHue = (userId: string | undefined): number => {
    if (!userId) {
        return 0;
    }

    let hash = 0;
    for (let index = 0; index < userId.length; index++) {
        hash = (hash << 5) - hash + userId.charCodeAt(index);
        hash |= 0;
    }

    return Math.abs(hash) % 360;
};

async function fetchOpenGraphPreview(
    url: string,
    signal?: AbortSignal
): Promise<OpenGraphData | null> {
    const response = await fetch(
        `https://halabakk-web.nawaf-alhasosah.workers.dev/api/open-graph?url=${encodeURIComponent(url)}`,
        {
            cache: "no-store",
            signal,
        }
    );

    if (!response.ok) {
        return null;
    }

    const payload = (await response.json()) as {
        openGraphData?: OpenGraphData | null;
    };

    return payload.openGraphData ?? null;
}

function ComposerOpenGraphPreview({
    data,
    isLoading,
}: {
    data: OpenGraphData | null;
    isLoading: boolean;
}) {
    return (
        <Box sx={{ px: 1.25, pt: 1, pb: 0.25 }}>
            <Box
                component={data?.og_url ? "a" : "div"}
                href={data?.og_url ?? undefined}
                target={data?.og_url ? "_blank" : undefined}
                rel={data?.og_url ? "noopener noreferrer" : undefined}
                sx={(theme) => ({
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    gap: 0.35,
                    width: "100%",
                    minWidth: 0,
                    borderRadius: 2,
                    p: 1,
                    textDecoration: "none",
                    color: "inherit",
                    backgroundColor:
                        theme.palette.mode === "dark"
                            ? "#1a1b1b"
                            : "#f7f5f3",
                })}
            >
                {isLoading ? (
                    <>
                        <Skeleton variant="text" width="55%" height={18} />
                        <Skeleton variant="text" width="92%" height={16} />
                        <Skeleton variant="text" width="38%" height={14} />
                    </>
                ) : (
                    <>
                        <Typography
                            variant="body2"
                            sx={{
                                width: "100%",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontWeight: 600,
                            }}
                        >
                            {data?.og_title}
                        </Typography>
                        {data?.og_description && (
                            <Typography
                                variant="body2"
                                sx={{
                                    color: "text.secondary",
                                    display: "-webkit-box",
                                    overflow: "hidden",
                                    WebkitBoxOrient: "vertical",
                                    WebkitLineClamp: 2,
                                    wordBreak: "break-word",
                                }}
                            >
                                {data.og_description}
                            </Typography>
                        )}
                        <Typography
                            variant="caption"
                            sx={{
                                width: "100%",
                                color: "text.secondary",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {data?.og_url}
                        </Typography>
                    </>
                )}
            </Box>
        </Box>
    );
}

export default function ChatRoomInputForm() {
    const { data: session } = authClient.useSession();
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const [micHover, setMicHover] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [draftInputScrollLeft, setDraftInputScrollLeft] = useState(0);

    const selectedChatId = useActiveChatStore((state) => state.selectedChatId);
    const draftValue = useActiveChatStore((state) =>
        selectedChatId ? state.draftsByChatId[selectedChatId] ?? "" : ""
    );
    const replyDraft = useActiveChatStore((state) =>
        selectedChatId ? state.replyDraftByChatId[selectedChatId] ?? null : null
    );
    const setDraft = useActiveChatStore((state) => state.setDraft);
    const clearReplyDraft = useActiveChatStore((state) => state.clearReplyDraft);
    const { sendAttachment, sendMessage } = useSendChatMessage();
    const { handleDraftChange, stopTyping } = useChatTyping(selectedChatId);
    const { contacts } = useDecryptedContacts();
    const [pendingVoiceSend, setPendingVoiceSend] = useState(false);
    const [voiceSendInFlight, setVoiceSendInFlight] = useState(false);
    const [openGraphPreview, setOpenGraphPreview] =
        useState<OpenGraphData | null>(null);
    const [openGraphPreviewUrl, setOpenGraphPreviewUrl] = useState<string | null>(
        null
    );
    const [openGraphLoading, setOpenGraphLoading] = useState(false);
    const voiceSendInFlightRef = useRef(false);
    const voiceSendBlobRef = useRef<Blob | null>(null);
    const isMountedRef = useRef(true);

    const linkPreviewDisabled = Boolean(
        (
            session?.user as
                | {
                      disableLinkPreview?: boolean | null;
                  }
                | undefined
        )?.disableLinkPreview
    );
    const draftFirstUrl = useMemo(() => findFirstUrl(draftValue), [draftValue]);
    const highlightedDraftParts = useMemo(
        () => splitTextByUrls(draftValue),
        [draftValue]
    );
    const shouldShowOpenGraphPreview =
        !linkPreviewDisabled &&
        Boolean(draftFirstUrl) &&
        (openGraphLoading || Boolean(openGraphPreview));
    const hasComposerTopContent =
        Boolean(replyDraft) || shouldShowOpenGraphPreview;

    const resolveOpenGraphPreviewForSend = async () => {
        if (linkPreviewDisabled || !draftFirstUrl) {
            return null;
        }

        if (openGraphPreviewUrl === draftFirstUrl && openGraphPreview) {
            return openGraphPreview;
        }

        try {
            return await fetchOpenGraphPreview(draftFirstUrl);
        } catch {
            return null;
        }
    };

    const handleSend = async () => {
        if (!selectedChatId) {
            return;
        }

        const openGraphData = await resolveOpenGraphPreviewForSend();
        stopTyping(selectedChatId);
        await sendMessage({
            text: draftValue,
            chatId: selectedChatId,
            openGraphData,
        });
    };

    const handleDraftInputScroll = () => {
        setDraftInputScrollLeft(inputRef.current?.scrollLeft ?? 0);
    };

    const recorderControls = useVoiceVisualizer();
    const {
        startRecording,
        stopRecording,
        togglePauseResume,
        isPausedRecording,
        isRecordingInProgress,
        isProcessingRecordedAudio,
        recordedBlob,
        formattedRecordingTime,
        clearCanvas,
    } = recorderControls;

    const sendAttachmentRef = useRef(sendAttachment);
    const clearCanvasRef = useRef(clearCanvas);

    useEffect(() => {
        sendAttachmentRef.current = sendAttachment;
    }, [sendAttachment]);

    useEffect(() => {
        clearCanvasRef.current = clearCanvas;
    }, [clearCanvas]);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (replyDraft) {
            inputRef.current?.focus();
        }
    }, [replyDraft]);

    useEffect(() => {
        if (linkPreviewDisabled || !draftFirstUrl) {
            setOpenGraphPreview(null);
            setOpenGraphPreviewUrl(null);
            setOpenGraphLoading(false);
            return;
        }

        let isActive = true;
        const controller = new AbortController();
        setOpenGraphPreview(null);
        setOpenGraphPreviewUrl(draftFirstUrl);
        setOpenGraphLoading(true);

        const timer = window.setTimeout(() => {
            void fetchOpenGraphPreview(draftFirstUrl, controller.signal)
                .then((preview) => {
                    if (isActive) {
                        setOpenGraphPreview(preview);
                    }
                })
                .catch(() => {
                    if (isActive) {
                        setOpenGraphPreview(null);
                    }
                })
                .finally(() => {
                    if (isActive) {
                        setOpenGraphLoading(false);
                    }
                });
        }, 300);

        return () => {
            isActive = false;
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [draftFirstUrl, linkPreviewDisabled]);

    const replySenderContact = findContactByUserId(
        contacts,
        replyDraft?.original_sender_user_id
    );
    const replySenderDisplayName =
        replyDraft?.original_sender_user_id === session?.user.id
            ? "You"
            : replySenderContact
              ? getContactDisplayName(replySenderContact)
              : replyDraft?.original_sender_user_id ?? "";
    const replyPreview = getReplyMessageLabel(replyDraft);

    useEffect(() => {
        if (!pendingVoiceSend || !recordedBlob || !selectedChatId) {
            return;
        }

        if (
            voiceSendInFlightRef.current ||
            voiceSendBlobRef.current === recordedBlob
        ) {
            return;
        }

        const sendRecordedVoice = async () => {
            voiceSendInFlightRef.current = true;
            voiceSendBlobRef.current = recordedBlob;
            setVoiceSendInFlight(true);

            try {
                const extension =
                    recordedBlob.type.split("/")[1]?.split(";")[0] ?? "webm";
                const recordedFile = new File(
                    [recordedBlob],
                    `voice-message.${extension}`,
                    {
                        type: recordedBlob.type || "audio/webm",
                        lastModified: Date.now(),
                    }
                );

                await sendAttachmentRef.current({
                    file: recordedFile,
                    attachedMedia: "voice",
                    chatId: selectedChatId,
                });
            } finally {
                voiceSendInFlightRef.current = false;
                voiceSendBlobRef.current = null;

                if (isMountedRef.current) {
                    setPendingVoiceSend(false);
                    setVoiceSendInFlight(false);
                    clearCanvasRef.current();
                }
            }
        };

        void sendRecordedVoice();
    }, [pendingVoiceSend, recordedBlob, selectedChatId]);

    const placeholder = useMemo(
        () =>
            isRTL
                ? "أكتب رسالة"
                : "Type a message",
        [isRTL]
    );

    return (
        <div className="absolute right-2 bottom-2 left-2 z-50 md:mx-auto md:max-w-7xl">
            {isRecordingInProgress ? (
                <div className="relative mx-auto flex w-100 flex-row items-center justify-between rounded-full bg-gray-100 p-1.25 shadow-sm dark:bg-[#242626] lg:w-161">
                    <div className="relative flex items-center gap-1">
                        <IconButton
                            type="button"
                            onClick={() => {
                                setPendingVoiceSend(false);
                                stopRecording();
                                clearCanvas();
                            }}
                            size="medium"
                            disabled={voiceSendInFlight}
                        >
                            <DeleteOutlined />
                        </IconButton>
                        <RecordTimer recordingTime={formattedRecordingTime} />
                        <div className="relative mx-2 min-w-40 flex-1 overflow-hidden lg:min-w-100">
                            <VoiceVisualizer
                                key={isRecordingInProgress ? "recording" : "idle"}
                                controls={recorderControls}
                                isControlPanelShown={false}
                                rounded={10}
                                height={40}
                                barWidth={4}
                                speed={0.5}
                            />
                        </div>
                        <IconButton
                            type="button"
                            onClick={() => togglePauseResume()}
                            size="medium"
                            disabled={voiceSendInFlight}
                        >
                            {isPausedRecording ? <PlayArrow /> : <Pause />}
                        </IconButton>
                        <IconButton
                            type="button"
                            onClick={() => {
                                setPendingVoiceSend(true);
                                stopRecording();
                            }}
                            size="medium"
                            disabled={voiceSendInFlight || isProcessingRecordedAudio}
                            sx={{
                                backgroundColor: "#25D366",
                                color: "#161717",
                                "&:hover": {
                                    backgroundColor: "#25D366",
                                    color: "#161717",
                                },
                            }}
                        >
                            <Send className={isRTL ? "rotate-180" : ""} />
                        </IconButton>
                    </div>
                </div>
            ) : (
                <Box
                    sx={(theme) => ({
                        overflow: "hidden",
                        borderRadius: hasComposerTopContent ? "18px" : 8,
                        boxShadow: "0px 2px 2px rgba(0,0,0,0.08)",
                        backgroundColor:
                            theme.palette.mode === "dark" ? "#242626" : "#ffffff",
                    })}
                >
                    {shouldShowOpenGraphPreview && (
                        <ComposerOpenGraphPreview
                            data={openGraphPreview}
                            isLoading={openGraphLoading}
                        />
                    )}
                    {replyDraft && (
                        <Box sx={{ px: 1.25, pt: 1, pb: 0.25 }}>
                            <Box
                                sx={(theme) => {
                                    const hue = getHue(
                                        replyDraft.original_sender_user_id
                                    );
                                    const accent = `hsl(${hue}, 80%, ${
                                        theme.palette.mode === "dark" ? "60%" : "35%"
                                    })`;

                                    return {
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 1,
                                        minWidth: 0,
                                        px: 1,
                                        py: 0.65,
                                        borderLeft: `4px solid ${accent}`,
                                        borderRadius: 1.5,
                                        backgroundColor:
                                            theme.palette.mode === "dark"
                                                ? "rgba(255,255,255,0.04)"
                                                : "rgba(0,0,0,0.04)",
                                    };
                                }}
                            >
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Typography
                                        variant="caption"
                                        sx={(theme) => {
                                            const hue = getHue(
                                                replyDraft.original_sender_user_id
                                            );

                                            return {
                                                display: "block",
                                                fontWeight: 600,
                                                lineHeight: 1.35,
                                                color: `hsl(${hue}, 80%, ${
                                                    theme.palette.mode === "dark"
                                                        ? "60%"
                                                        : "35%"
                                                })`,
                                            };
                                        }}
                                    >
                                        {replySenderDisplayName}
                                    </Typography>
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            color: "text.secondary",
                                            display: "block",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {replyPreview}
                                    </Typography>
                                </Box>
                                <IconButton
                                    type="button"
                                    size="small"
                                    aria-label="Cancel reply"
                                    onClick={() => {
                                        if (selectedChatId) {
                                            clearReplyDraft(selectedChatId);
                                        }
                                    }}
                                >
                                    <CloseOutlined sx={{ fontSize: 18 }} />
                                </IconButton>
                            </Box>
                        </Box>
                    )}
                    <Box sx={{ position: "relative" }}>
                        {draftValue.length > 0 && (
                            <Box
                                aria-hidden
                                sx={(theme) => ({
                                    position: "absolute",
                                    top: 0,
                                    bottom: 0,
                                    left: 90,
                                    right: 56,
                                    zIndex: 2,
                                    display: "flex",
                                    alignItems: "center",
                                    overflow: "hidden",
                                    pointerEvents: "none",
                                    whiteSpace: "pre",
                                    color: theme.palette.text.primary,
                                    fontFamily: theme.typography.body1.fontFamily,
                                    fontSize: theme.typography.body1.fontSize,
                                    lineHeight: theme.typography.body1.lineHeight,
                                })}
                            >
                                <Box
                                    component="span"
                                    sx={{
                                        display: "inline-block",
                                        minWidth: "max-content",
                                        transform: `translateX(-${draftInputScrollLeft}px)`,
                                    }}
                                >
                                    {highlightedDraftParts.map((part, index) => (
                                        <Box
                                            component="span"
                                            key={`${part.text}-${index}`}
                                            sx={{
                                                color: part.isUrl
                                                    ? "#25D366"
                                                    : "text.primary",
                                            }}
                                        >
                                            {part.text}
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        )}
                        <TextField
                            hiddenLabel
                            id="filled-chat-input-bar"
                            variant="filled"
                            size="small"
                            placeholder={placeholder}
                            fullWidth
                            value={draftValue}
                            onChange={(event) => {
                                if (!selectedChatId) {
                                    return;
                                }
                                setDraft(selectedChatId, event.target.value);
                                handleDraftChange(event.target.value);
                                setDraftInputScrollLeft(event.target.scrollLeft);
                            }}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" && !event.shiftKey) {
                                    event.preventDefault();
                                    void handleSend();
                                }
                            }}
                            inputRef={inputRef}
                            inputProps={{
                                onScroll: handleDraftInputScroll,
                            }}
                            sx={(theme) => ({
                                "& .MuiFilledInput-root": {
                                    borderRadius: hasComposerTopContent
                                        ? "0 0 18px 18px"
                                        : 8,
                                    boxShadow: "none",
                                    paddingY: "5px",
                                    paddingX: "5px",
                                    backgroundColor:
                                        theme.palette.mode === "dark"
                                            ? "#242626"
                                            : "#ffffff",
                                    "&.Mui-focused": {
                                        outline: "none",
                                        backgroundColor:
                                            theme.palette.mode === "dark"
                                                ? "#242626"
                                                : "#ffffff",
                                    },
                                    "&:hover": {
                                        backgroundColor:
                                            theme.palette.mode === "dark"
                                                ? "#242626"
                                                : "#ffffff",
                                    },
                                    "&::before": { display: "none" },
                                    "&::after": { display: "none" },
                                },
                                "& .MuiFilledInput-input": {
                                    position: "relative",
                                    zIndex: 3,
                                    color: "transparent",
                                    WebkitTextFillColor: "transparent",
                                    caretColor: theme.palette.text.primary,
                                    "&::placeholder": {
                                        color: theme.palette.text.secondary,
                                        WebkitTextFillColor:
                                            theme.palette.text.secondary,
                                        opacity: 1,
                                    },
                                },
                            })}
                            InputProps={{
                                disableUnderline: true,
                                startAdornment: (
                                    <InputAdornment position="start" sx={{ zIndex: 4 }}>
                                        <ChatRoomInputAttachButton />
                                        <ChatRoomInputEmojiButton
                                            messageInput={draftValue}
                                            setMessageInput={(value) => {
                                                if (!selectedChatId) {
                                                    return;
                                                }
                                                setDraft(selectedChatId, value);
                                                handleDraftChange(value);
                                            }}
                                        />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end" sx={{ zIndex: 4 }}>
                                        {draftValue.trim().length > 0 ? (
                                            <IconButton
                                                type="button"
                                                onClick={() => void handleSend()}
                                                size="medium"
                                                sx={{
                                                    backgroundColor: "#25D366",
                                                    color: "#161717",
                                                    "&:hover": {
                                                        backgroundColor: "#25D366",
                                                        color: "#161717",
                                                    },
                                                }}
                                            >
                                                <Send
                                                    className={isRTL ? "rotate-180" : ""}
                                                />
                                            </IconButton>
                                        ) : (
                                            <IconButton
                                                type="button"
                                                onClick={() => startRecording()}
                                                size="medium"
                                                onMouseEnter={() => setMicHover(true)}
                                                onMouseLeave={() => setMicHover(false)}
                                                sx={{
                                                    transition:
                                                        "background-color 0.2s ease",
                                                    "&:hover": {
                                                        backgroundColor: "#25D366",
                                                        color: "#161717",
                                                    },
                                                }}
                                            >
                                                {micHover ? <Mic /> : <MicNoneOutlined />}
                                            </IconButton>
                                        )}
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Box>
                </Box>
            )}
        </div>
    );
}
