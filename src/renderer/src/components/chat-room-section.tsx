import { useEffect, useMemo, useState } from "react";
import { useCryptoKeys } from "../context/crypto";
import { authClient } from "../lib/auth-client";
import { decryptMessageBatch } from "../lib/chat-e2ee";
import { normalizeMessage } from "../lib/chat-utils";
import { useMediaAttachmentStore } from "../store/media-attachment-store";
import { useActiveChatStore } from "../store/use-active-chat-store";
import { useMessageActions } from "../hooks/use-message-actions";
import type { Message } from "../types/messages.type";
import ChatRoomHeader from "./chat-room-header";
import ChatRoomContent from "./chat-room-content";
import MediaAttachmentContainer from "./media-attachment-container";
import ChatRoomPinContent from "./chat-room-pin-content";

type RawMessage = Omit<Message, "created_at" | "updated_at"> & {
    created_at: string | Date;
    updated_at: string | Date;
};

function sortPinnedMessages(messages: Message[]) {
    return [...messages].sort(
        (left, right) => right.created_at.getTime() - left.created_at.getTime()
    );
}

export default function ChatRoomSection() {
    const { isReady } = useCryptoKeys();
    const { data: session } = authClient.useSession();
    const selectedChatId = useActiveChatStore((state) => state.selectedChatId);
    const messagesByChatId = useActiveChatStore((state) => state.messagesByChatId);
    const attachment = useMediaAttachmentStore((state) => state.attachment);
    const clearMediaAttachment = useMediaAttachmentStore(
        (state) => state.clearMediaAttachment
    );
    const { pinMessage } = useMessageActions();
    const currentUserId = session?.user.id ?? null;
    const loadedMessages = selectedChatId
        ? messagesByChatId[selectedChatId] ?? []
        : [];
    const [pinnedMessages, setPinnedMessages] = useState<Message[]>([]);
    const [activePinnedMessageId, setActivePinnedMessageId] = useState<
        string | null
    >(null);
    const activePinnedMessage = useMemo(() => {
        if (pinnedMessages.length === 0) {
            return null;
        }

        return (
            pinnedMessages.find(
                (message) => message.message_id === activePinnedMessageId
            ) ?? pinnedMessages[0]
        );
    }, [activePinnedMessageId, pinnedMessages]);

    useEffect(() => {
        if (attachment && attachment.chatId !== selectedChatId) {
            clearMediaAttachment();
        }
    }, [attachment, clearMediaAttachment, selectedChatId]);

    useEffect(() => {
        setPinnedMessages([]);
        setActivePinnedMessageId(null);
    }, [selectedChatId]);

    useEffect(() => {
        if (!selectedChatId || !currentUserId || !isReady) {
            return;
        }

        let isCancelled = false;

        const fetchPinnedMessages = async () => {
            const response = await fetch(
                `https://halabakk-web.nawaf-alhasosah.workers.dev/api/messages?chatRoomId=${encodeURIComponent(selectedChatId)}&limit=100&pinnedOnly=true`,
                { cache: "no-store" }
            );

            if (!response.ok) {
                return;
            }

            const payload = (await response.json()) as {
                messages: RawMessage[];
            };
            const normalizedMessages = payload.messages.map(normalizeMessage);
            const decryptedMessages = await decryptMessageBatch({
                currentUserId,
                messages: normalizedMessages,
            });

            if (!isCancelled) {
                const nextPinnedMessages = sortPinnedMessages(
                    decryptedMessages.filter(
                        (message) => message.user_ids_pin_it?.length
                    )
                );
                setPinnedMessages(nextPinnedMessages);
                setActivePinnedMessageId(
                    (current) =>
                        current ??
                        nextPinnedMessages[0]?.message_id ??
                        null
                );
            }
        };

        void fetchPinnedMessages();

        const handlePinnedMessagesChanged = (event: Event) => {
            const detail = (event as CustomEvent<{ chatId?: string }>).detail;

            if (detail?.chatId === selectedChatId) {
                void fetchPinnedMessages();
            }
        };

        window.addEventListener(
            "chat-room:pin-flags-updated",
            handlePinnedMessagesChanged
        );

        return () => {
            isCancelled = true;
            window.removeEventListener(
                "chat-room:pin-flags-updated",
                handlePinnedMessagesChanged
            );
        };
    }, [currentUserId, isReady, selectedChatId]);

    useEffect(() => {
        if (!selectedChatId || loadedMessages.length === 0) {
            return;
        }

        setPinnedMessages((current) => {
            const byId = new Map(current.map((message) => [message.message_id, message]));

            for (const message of loadedMessages) {
                if (message.user_ids_pin_it?.length) {
                    byId.set(message.message_id, message);
                } else {
                    byId.delete(message.message_id);
                }
            }

            return sortPinnedMessages([...byId.values()]);
        });
    }, [loadedMessages, selectedChatId]);

    useEffect(() => {
        if (pinnedMessages.length === 0) {
            setActivePinnedMessageId(null);
            return;
        }

        setActivePinnedMessageId((current) =>
            current &&
                pinnedMessages.some((message) => message.message_id === current)
                ? current
                : pinnedMessages[0].message_id
        );
    }, [pinnedMessages]);

    useEffect(() => {
        const handlePinnedMessageVisible = (event: Event) => {
            const detail = (
                event as CustomEvent<{ chatId?: string; messageId?: string }>
            ).detail;

            if (
                !selectedChatId ||
                detail?.chatId !== selectedChatId ||
                detail.messageId !== activePinnedMessage?.message_id
            ) {
                return;
            }

            const currentPinnedMessage = activePinnedMessage;
            if (!currentPinnedMessage) {
                return;
            }

            const currentPinnedCreatedAt =
                currentPinnedMessage.created_at.getTime();

            const nextOlderPinnedMessage = pinnedMessages.find(
                (message) =>
                    message.created_at.getTime() < currentPinnedCreatedAt
            );

            if (nextOlderPinnedMessage) {
                setActivePinnedMessageId(nextOlderPinnedMessage.message_id);
            }
        };

        window.addEventListener(
            "chat-room:pinned-message-visible",
            handlePinnedMessageVisible
        );

        return () => {
            window.removeEventListener(
                "chat-room:pinned-message-visible",
                handlePinnedMessageVisible
            );
        };
    }, [activePinnedMessage, pinnedMessages, selectedChatId]);

    const handleOpenPinnedMessage = () => {
        if (!selectedChatId || !activePinnedMessage) {
            return;
        }

        window.dispatchEvent(
            new CustomEvent("chat-room:scroll-to-message", {
                detail: {
                    chatId: selectedChatId,
                    messageId: activePinnedMessage.message_id,
                },
            })
        );
    };

    return (
        <div className="flex h-full w-full flex-col overflow-hidden">
            <ChatRoomHeader />
            {activePinnedMessage ? (
                <div className="relative">
                    <ChatRoomPinContent
                        pinnedMessage={activePinnedMessage}
                        onOpen={handleOpenPinnedMessage}
                        onUnpin={() =>
                            void pinMessage(activePinnedMessage, false)
                        }
                    />
                </div>
            ) : null}
            {attachment ? <MediaAttachmentContainer /> : <ChatRoomContent />}
        </div>
    );
}
