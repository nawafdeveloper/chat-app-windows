import { useEffect, useRef } from "react";
import { useCryptoKeys } from "../context/crypto";
import { authClient } from "../lib/auth-client";
import {
    applyContactToSingleChat,
    buildChatFromReaction,
    buildChatFromMessage,
    normalizeChatItem,
    normalizeMessage,
    resolveDirectChatPartner,
} from "../lib/chat-utils";
import {
    decryptChatPreviewBatch,
    decryptMessageBatch,
} from "../lib/chat-e2ee";
import { decryptStoredContact } from "../lib/contact-crypto";
import { resolveDirectChatContact } from "../lib/contact-display";
import { fetchWithNeonColdBootRetry } from "../lib/electron-api-fetch";
import { emitChatMessageNotification } from "../lib/message-notifications";
import { useActiveChatStore } from "../store/use-active-chat-store";
import { useContactDirectoryStore } from "../store/use-contact-directory-store";
import { useRealtimeStore } from "../store/use-realtime-store";
import type { ChatItemType } from "../types/chats.type";
import type { Message } from "../types/messages.type";
import type { ServerRealtimeEvent } from "../types/realtime-events";

async function hydrateStoredContactOverrides(chats: ChatItemType[]) {
    const chatsWithStoredContacts = await Promise.all(
        chats.map(async (chat) => {
            if (chat.chat_type !== "single" || !chat.stored_contact) {
                return chat;
            }

            try {
                const decryptedContact = await decryptStoredContact(
                    chat.stored_contact
                );

                return applyContactToSingleChat(chat, decryptedContact);
            } catch {
                return chat;
            }
        })
    );

    return chatsWithStoredContacts;
}

export function useChatRealtime() {
    const { isReady } = useCryptoKeys();
    const { data: session } = authClient.useSession();
    const selectedChatId = useActiveChatStore((state) => state.selectedChatId);
    const chats = useActiveChatStore((state) => state.chats);
    const setChats = useActiveChatStore((state) => state.setChats);
    const upsertChat = useActiveChatStore((state) => state.upsertChat);
    const setChatsLoading = useActiveChatStore((state) => state.setChatsLoading);
    const setChatsError = useActiveChatStore((state) => state.setChatsError);
    const setMessages = useActiveChatStore((state) => state.setMessages);
    const appendMessage = useActiveChatStore((state) => state.appendMessage);
    const setMessagesLoading = useActiveChatStore(
        (state) => state.setMessagesLoading
    );
    const setHasOlderMessages = useActiveChatStore(
        (state) => state.setHasOlderMessages
    );
    const setPresence = useActiveChatStore((state) => state.setPresence);
    const setTypingUsers = useActiveChatStore((state) => state.setTypingUsers);
    const markChatRead = useActiveChatStore((state) => state.markChatRead);
    const markMessagesReadByUser = useActiveChatStore(
        (state) => state.markMessagesReadByUser
    );
    const setRecipientPhone = useActiveChatStore((state) => state.setRecipientPhone);
    const setSocket = useRealtimeStore((state) => state.setSocket);
    const setStatus = useRealtimeStore((state) => state.setStatus);
    const sendEvent = useRealtimeStore((state) => state.sendEvent);

    const currentUserId = session?.user.id ?? null;
    const currentPhone = (session?.user as { phoneNumber?: string | null } | undefined)
        ?.phoneNumber ?? null;

    const selectedChatIdRef = useRef<string | null>(selectedChatId);
    const joinedChatIdRef = useRef<string | null>(null);
    const reconnectTimeoutRef = useRef<number | null>(null);
    const notificationSettingsRef = useRef({
        disableMessagesNotifications: false,
        disableGroupsNotifications: false,
    });

    const applyKnownContactOverride = (chat: ChatItemType) => {
        const directContact = resolveDirectChatContact(
            chat,
            useContactDirectoryStore.getState().contacts,
            currentPhone
        );

        return directContact ? applyContactToSingleChat(chat, directContact) : chat;
    };

    const isBlockedSingleChat = (chatId: string | null) => {
        if (!chatId) {
            return false;
        }

        const chat = useActiveChatStore
            .getState()
            .chats.find((item) => item.chat_id === chatId);

        return chat?.chat_type === "single" && chat.is_blocked_chat;
    };

    useEffect(() => {
        selectedChatIdRef.current = selectedChatId;
    }, [selectedChatId]);

    useEffect(() => {
        const user = session?.user as
            | {
                  disableMessagesNotifications?: boolean | null;
                  disableGroupsNotifications?: boolean | null;
              }
            | undefined;

        notificationSettingsRef.current = {
            disableMessagesNotifications: Boolean(
                user?.disableMessagesNotifications
            ),
            disableGroupsNotifications: Boolean(user?.disableGroupsNotifications),
        };
    }, [session]);

    useEffect(() => {
        if (!currentUserId || !isReady) {
            return;
        }

        let isCancelled = false;

        const fetchChats = async () => {
            try {
                setChatsLoading(true);
                setChatsError(null);

                const response = await fetchWithNeonColdBootRetry("/api/chats", {
                    cache: "no-store",
                });
                if (!response.ok) {
                    throw new Error("Failed to fetch chats");
                }

                const payload = (await response.json()) as {
                    chats: ChatItemType[];
                };

                if (isCancelled) {
                    return;
                }

                const normalizedChats = payload.chats.map(normalizeChatItem);
                const chatsWithStoredContacts = await hydrateStoredContactOverrides(
                    normalizedChats
                );
                const decryptedChats = await decryptChatPreviewBatch({
                    chats: chatsWithStoredContacts,
                    currentUserId,
                });

                if (!isCancelled) {
                    setChats(
                        decryptedChats.map((chat) => applyKnownContactOverride(chat))
                    );
                }
            } catch (error) {
                if (!isCancelled) {
                    setChatsError(
                        error instanceof Error
                            ? error.message
                            : "Failed to load chats"
                    );
                }
            } finally {
                if (!isCancelled) {
                    setChatsLoading(false);
                }
            }
        };

        void fetchChats();
        const handleContactsChanged = () => {
            void fetchChats();
        };
        window.addEventListener("contacts:changed", handleContactsChanged);

        return () => {
            isCancelled = true;
            window.removeEventListener("contacts:changed", handleContactsChanged);
        };
    }, [currentPhone, currentUserId, isReady, setChats, setChatsError, setChatsLoading]);

    useEffect(() => {
        if (!selectedChatId) {
            setRecipientPhone(null);
            return;
        }

        const selectedChat = chats.find((chat) => chat.chat_id === selectedChatId);

        if (selectedChat?.chat_type === "single") {
            setRecipientPhone(
                selectedChat.contact_phone ??
                    resolveDirectChatPartner(selectedChat.chat_id, currentPhone)
            );
            if (!selectedChat.is_blocked_chat) {
                markChatRead(selectedChat.chat_id);
            }
        } else {
            setRecipientPhone(null);
            markChatRead(selectedChatId);
        }
    }, [chats, currentPhone, markChatRead, selectedChatId, setRecipientPhone]);

    useEffect(() => {
        if (!currentUserId || !selectedChatId || !isReady) {
            return;
        }

        let isCancelled = false;

        const fetchMessages = async () => {
            try {
                setMessagesLoading(selectedChatId, true);
                const response = await fetchWithNeonColdBootRetry(
                    `/api/messages?chatRoomId=${encodeURIComponent(selectedChatId)}&limit=20`,
                    { cache: "no-store" }
                );
                if (!response.ok) {
                    throw new Error("Failed to fetch messages");
                }

                const payload = (await response.json()) as {
                    messages: (Omit<Message, "created_at" | "updated_at"> & {
                        created_at: string;
                        updated_at: string;
                    })[];
                    hasMore?: boolean;
                };

                if (isCancelled) {
                    return;
                }

                const normalizedMessages = payload.messages.map(normalizeMessage);
                const decryptedMessages = await decryptMessageBatch({
                    currentUserId,
                    messages: normalizedMessages,
                });

                if (!isCancelled) {
                    setMessages(selectedChatId, decryptedMessages);
                    setHasOlderMessages(
                        selectedChatId,
                        payload.hasMore ?? normalizedMessages.length === 20
                    );
                }
            } catch (error) {
                if (!isCancelled) {
                    setChatsError(
                        error instanceof Error
                            ? error.message
                            : "Failed to load messages"
                    );
                }
            } finally {
                if (!isCancelled) {
                    setMessagesLoading(selectedChatId, false);
                }
            }
        };

        void fetchMessages();

        return () => {
            isCancelled = true;
        };
    }, [
        currentUserId,
        isReady,
        selectedChatId,
        setChatsError,
        setHasOlderMessages,
        setMessages,
        setMessagesLoading,
    ]);

    useEffect(() => {
        if (!currentUserId || !isReady) {
            return;
        }

        let isDisposed = false;
        let socket: WebSocket | null = null;

        const handleServerEvent = async (event: ServerRealtimeEvent) => {
            switch (event.type) {
                case "GROUP_CREATED": {
                    const normalizedChat = normalizeChatItem(event.chat);
                    const [decryptedChat] = await decryptChatPreviewBatch({
                        chats: [normalizedChat],
                        currentUserId,
                    });

                    upsertChat(decryptedChat);
                    break;
                }

                case "MESSAGE_SENT": {
                    const normalizedMessage = normalizeMessage(event.message);
                    const [nextMessage] = await decryptMessageBatch({
                        currentUserId,
                        messages: [normalizedMessage],
                    });

                    const messageId =
                        event.clientMessageId ?? nextMessage.message_id;

                    useActiveChatStore.getState().updateMessage(
                        event.conversationId,
                        messageId,
                        () => ({
                            ...nextMessage,
                            client_status: "sent",
                            client_error: null,
                            client_received_via_realtime: false,
                        })
                    );

                    const existingChat = useActiveChatStore
                        .getState()
                        .chats.find((chat) => chat.chat_id === event.conversationId);

                    upsertChat(
                        applyKnownContactOverride(
                            buildChatFromMessage({
                                conversationId: event.conversationId,
                                conversationType: event.conversationType,
                                message: nextMessage,
                                currentUserId,
                                unreadCount: 0,
                                fallbackExistingChat: existingChat,
                            })
                        )
                    );
                    break;
                }

                case "NEW_MESSAGE": {
                    if (isBlockedSingleChat(event.conversationId)) {
                        break;
                    }

                    const normalizedMessage = normalizeMessage(event.message);
                    const [nextMessage] = await decryptMessageBatch({
                        currentUserId,
                        messages: [normalizedMessage],
                    });

                    appendMessage(event.conversationId, {
                        ...nextMessage,
                        client_status: "sent",
                        client_error: null,
                        client_received_via_realtime:
                            nextMessage.sender_user_id !== currentUserId,
                    });

                    const existingChat = useActiveChatStore
                        .getState()
                        .chats.find((chat) => chat.chat_id === event.conversationId);
                    const isSelected =
                        useActiveChatStore.getState().selectedChatId ===
                        event.conversationId;
                    const unreadCount =
                        nextMessage.sender_user_id === currentUserId || isSelected
                            ? 0
                            : (existingChat?.unreaded_messages_length ?? 0) + 1;

                    const nextChat = applyKnownContactOverride(
                        buildChatFromMessage({
                            conversationId: event.conversationId,
                            conversationType: event.conversationType,
                            message: nextMessage,
                            currentUserId,
                            unreadCount,
                            fallbackExistingChat: existingChat,
                        })
                    );
                    upsertChat(nextChat);
                    const notificationSettings = notificationSettingsRef.current;
                    const shouldNotify =
                        nextMessage.sender_user_id !== currentUserId &&
                        !nextChat.is_muted_chat_notifications &&
                        !notificationSettings.disableMessagesNotifications &&
                        !(
                            event.conversationType === "group" &&
                            notificationSettings.disableGroupsNotifications
                        );

                    if (shouldNotify) {
                        emitChatMessageNotification({
                            conversationId: event.conversationId,
                            conversationType: event.conversationType,
                            message: nextMessage,
                            chat: nextChat,
                            unreadCount,
                        });
                    }
                    if (isSelected) {
                        markChatRead(event.conversationId);
                        if (nextMessage.sender_user_id !== currentUserId) {
                            sendEvent({
                                type: "MARK_READ",
                                conversationId: event.conversationId,
                                messageId: nextMessage.message_id,
                            });
                        }
                    }
                    break;
                }

                case "CONVERSATION_UPDATED": {
                    if (isBlockedSingleChat(event.conversationId)) {
                        break;
                    }

                    const normalizedMessage = normalizeMessage(event.lastMessage);
                    const [nextMessage] = await decryptMessageBatch({
                        currentUserId,
                        messages: [normalizedMessage],
                    });
                    const existingChat = useActiveChatStore
                        .getState()
                        .chats.find((chat) => chat.chat_id === event.conversationId);
                    const isSelected =
                        useActiveChatStore.getState().selectedChatId ===
                        event.conversationId;
                    const messageAlreadyExists = Boolean(
                        useActiveChatStore
                            .getState()
                            .messagesByChatId[event.conversationId]?.some(
                                (message) =>
                                    message.message_id === nextMessage.message_id
                            )
                    );

                    if (isSelected && !messageAlreadyExists) {
                        appendMessage(event.conversationId, {
                            ...nextMessage,
                            client_status: "sent",
                            client_error: null,
                            client_received_via_realtime:
                                nextMessage.sender_user_id !== currentUserId,
                        });
                    }

                    const nextChat = applyKnownContactOverride(
                        buildChatFromMessage({
                            conversationId: event.conversationId,
                            conversationType: event.conversationType,
                            message: nextMessage,
                            currentUserId,
                            unreadCount: isSelected ? 0 : event.unreadCount,
                            fallbackExistingChat: existingChat,
                        })
                    );
                    upsertChat(nextChat);
                    const notificationSettings = notificationSettingsRef.current;
                    const shouldNotify =
                        nextMessage.sender_user_id !== currentUserId &&
                        !nextChat.is_muted_chat_notifications &&
                        !notificationSettings.disableMessagesNotifications &&
                        !(
                            event.conversationType === "group" &&
                            notificationSettings.disableGroupsNotifications
                        );

                    if (shouldNotify) {
                        emitChatMessageNotification({
                            conversationId: event.conversationId,
                            conversationType: event.conversationType,
                            message: nextMessage,
                            chat: nextChat,
                            unreadCount: isSelected ? 0 : event.unreadCount,
                        });
                    }
                    if (
                        isSelected &&
                        nextMessage.sender_user_id !== currentUserId
                    ) {
                        sendEvent({
                            type: "MARK_READ",
                            conversationId: event.conversationId,
                            messageId: nextMessage.message_id,
                        });
                    }
                    break;
                }

                case "MESSAGE_REACTION_UPDATED": {
                    const updatedAt = new Date(event.updatedAt);
                    const safeUpdatedAt = Number.isNaN(updatedAt.getTime())
                        ? new Date()
                        : updatedAt;

                    useActiveChatStore.getState().updateMessage(
                        event.conversationId,
                        event.messageId,
                        (message) => ({
                            ...message,
                            message_raction: event.reaction,
                            updated_at: safeUpdatedAt,
                        })
                    );

                    const existingChat = useActiveChatStore
                        .getState()
                        .chats.find((chat) => chat.chat_id === event.conversationId);
                    const isSelected =
                        useActiveChatStore.getState().selectedChatId ===
                        event.conversationId;

                    upsertChat(
                        applyKnownContactOverride(
                            buildChatFromReaction({
                                conversationId: event.conversationId,
                                conversationType: event.conversationType,
                                messageId: event.messageId,
                                reaction: event.reaction,
                                updatedAt: safeUpdatedAt,
                                currentUserId,
                                unreadCount: isSelected
                                    ? 0
                                    : event.unreadCount,
                                fallbackExistingChat: existingChat,
                            })
                        )
                    );
                    if (isSelected) {
                        markChatRead(event.conversationId);
                    }
                    break;
                }

                case "MESSAGE_FLAGS_UPDATED": {
                    const updatedAt = new Date(event.updatedAt);
                    const safeUpdatedAt = Number.isNaN(updatedAt.getTime())
                        ? new Date()
                        : updatedAt;

                    useActiveChatStore.getState().updateMessage(
                        event.conversationId,
                        event.messageId,
                        (message) => ({
                            ...message,
                            user_ids_pin_it: event.userIdsPinIt,
                            updated_at: safeUpdatedAt,
                        })
                    );
                    window.dispatchEvent(
                        new CustomEvent("chat-room:pin-flags-updated", {
                            detail: {
                                chatId: event.conversationId,
                                messageId: event.messageId,
                            },
                        })
                    );
                    break;
                }

                case "CONVERSATION_PRESENCE": {
                    if (isBlockedSingleChat(event.conversationId)) {
                        break;
                    }

                    setPresence(event.conversationId, {
                        activeUsers: event.activeUsers,
                        activeUsersCount: event.activeUsersCount,
                    });
                    break;
                }

                case "CONVERSATION_TYPING": {
                    if (isBlockedSingleChat(event.conversationId)) {
                        break;
                    }

                    setTypingUsers(
                        event.conversationId,
                        event.activeTypingUsers.filter(
                            (userId) => userId !== currentUserId
                        )
                    );
                    break;
                }

                case "MARK_READ": {
                    const readAt = new Date(event.readAt);
                    if (!Number.isNaN(readAt.getTime())) {
                        markMessagesReadByUser(
                            event.conversationId,
                            event.userId,
                            readAt
                        );
                    }
                    break;
                }

                case "ERROR": {
                    setChatsError(event.message);
                    break;
                }

                default:
                    break;
            }
        };

        const connect = () => {
            setStatus("connecting");
            const protocol = window.location.protocol === "https:" ? "wss" : "ws";
            socket = new WebSocket(`${protocol}://${window.location.host}https://halabakk-web.nawaf-alhasosah.workers.dev//api/realtime`);
            setSocket(socket);

            socket.addEventListener("open", () => {
                setStatus("connected");

                if (
                    selectedChatIdRef.current &&
                    !isBlockedSingleChat(selectedChatIdRef.current)
                ) {
                    sendEvent({
                        type: "JOIN_CONVERSATION",
                        conversationId: selectedChatIdRef.current,
                    });
                    sendEvent({
                        type: "MARK_READ",
                        conversationId: selectedChatIdRef.current,
                    });
                }
            });

            socket.addEventListener("message", (messageEvent) => {
                try {
                    const payload = JSON.parse(
                        messageEvent.data as string
                    ) as ServerRealtimeEvent;
                    void handleServerEvent(payload);
                } catch {
                    setChatsError("Received malformed realtime event");
                }
            });

            socket.addEventListener("error", () => {
                setStatus("error");
            });

            socket.addEventListener("close", () => {
                setSocket(null);
                if (isDisposed) {
                    return;
                }

                setStatus("error");
                reconnectTimeoutRef.current = window.setTimeout(connect, 1500);
            });
        };

        connect();

        return () => {
            isDisposed = true;
            if (reconnectTimeoutRef.current) {
                window.clearTimeout(reconnectTimeoutRef.current);
            }

            if (socket?.readyState === WebSocket.OPEN && selectedChatIdRef.current) {
                socket.send(
                    JSON.stringify({
                        type: "LEAVE_CONVERSATION",
                        conversationId: selectedChatIdRef.current,
                    })
                );
            }

            socket?.close();
            setSocket(null);
            setStatus("idle");
        };
    }, [
        appendMessage,
        currentPhone,
        currentUserId,
        isReady,
        markChatRead,
        markMessagesReadByUser,
        sendEvent,
        setChatsError,
        setPresence,
        setSocket,
        setStatus,
        setTypingUsers,
        upsertChat,
    ]);

    useEffect(() => {
        const previousSelectedChatId = joinedChatIdRef.current;
        const selectedBlocked = isBlockedSingleChat(selectedChatId);

        if (
            previousSelectedChatId &&
            (previousSelectedChatId !== selectedChatId || selectedBlocked)
        ) {
            sendEvent({
                type: "LEAVE_CONVERSATION",
                conversationId: previousSelectedChatId,
            });
        }

        if (
            selectedChatId &&
            previousSelectedChatId !== selectedChatId &&
            !selectedBlocked
        ) {
            sendEvent({
                type: "JOIN_CONVERSATION",
                conversationId: selectedChatId,
            });
        }

        if (selectedChatId && !selectedBlocked) {
            sendEvent({
                type: "MARK_READ",
                conversationId: selectedChatId,
            });
        }

        selectedChatIdRef.current = selectedChatId;
        joinedChatIdRef.current = selectedBlocked ? null : selectedChatId;
    }, [chats, selectedChatId, sendEvent]);
}
