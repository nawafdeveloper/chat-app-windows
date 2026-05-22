import { useEffect, useRef, type MutableRefObject } from "react";
import { authClient } from "../lib/auth-client";
import {
    CHAT_MESSAGE_NOTIFICATION_EVENT,
    getMessageNotificationPreview,
    type ChatMessageNotificationEventDetail,
} from "../lib/message-notifications";
import { publicAssetSrc } from "../lib/public-assets";
import type { Message } from "../types/messages.type";

type NotificationUser = {
    id?: string;
    disableMessagesNotifications?: boolean | null;
    disableGroupsNotifications?: boolean | null;
};

type SerializableMessage = Omit<Message, "created_at" | "updated_at"> & {
    created_at: string;
    updated_at: string;
};

type NotificationOptionsWithRenotify = NotificationOptions & {
    renotify?: boolean;
};

function serializeMessage(message: Message): SerializableMessage {
    return {
        ...message,
        created_at: message.created_at.toISOString(),
        updated_at: message.updated_at.toISOString(),
    };
}

function getNotificationTitle(detail: ChatMessageNotificationEventDetail) {
    const chatName = detail.chat?.display_name?.trim();

    if (chatName) {
        return chatName;
    }

    if (detail.conversationType === "group") {
        return "New group message";
    }

    return "New message";
}

function getNotificationBody(detail: ChatMessageNotificationEventDetail) {
    const preview = getMessageNotificationPreview(detail.message);

    if (detail.conversationType !== "group") {
        return preview;
    }

    const senderName = detail.message.sender_user_id;
    return senderName ? `${senderName}: ${preview}` : preview;
}

async function showNotification({
    title,
    options,
    registrationRef,
}: {
    title: string;
    options: NotificationOptionsWithRenotify;
    registrationRef: MutableRefObject<ServiceWorkerRegistration | null>;
}) {
    if (!("Notification" in window) || window.Notification.permission !== "granted") {
        return;
    }

    if ("serviceWorker" in navigator) {
        try {
            if (!registrationRef.current) {
                registrationRef.current = await navigator.serviceWorker.register(
                    "/sw.js",
                    {
                        scope: "/",
                        updateViaCache: "none",
                    }
                );
            }

            await registrationRef.current.showNotification(title, options);
            return;
        } catch {
            // Fall back to the page-level Notifications API below.
        }
    }

    new window.Notification(title, options);
}

export default function Notification() {
    const { data: session } = authClient.useSession();
    const sessionUserRef = useRef<NotificationUser | null>(null);
    const shownMessageIdsRef = useRef<Set<string>>(new Set());
    const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

    useEffect(() => {
        sessionUserRef.current = (session?.user as NotificationUser | undefined) ?? null;
    }, [session]);

    useEffect(() => {
        const handleNewMessage = (event: Event) => {
            const detail = (event as CustomEvent<ChatMessageNotificationEventDetail>)
                .detail;
            const currentUser = sessionUserRef.current;

            if (!detail?.message || !currentUser?.id) {
                return;
            }

            if (detail.message.sender_user_id === currentUser.id) {
                return;
            }

            if (shownMessageIdsRef.current.has(detail.message.message_id)) {
                return;
            }

            if (detail.chat?.is_muted_chat_notifications) {
                return;
            }

            if (currentUser.disableMessagesNotifications) {
                return;
            }

            if (
                detail.conversationType === "group" &&
                currentUser.disableGroupsNotifications
            ) {
                return;
            }

            shownMessageIdsRef.current.add(detail.message.message_id);

            const title = getNotificationTitle(detail);
            const body = getNotificationBody(detail);
            const notificationData = {
                url: `/?chatId=${encodeURIComponent(detail.conversationId)}`,
                conversationId: detail.conversationId,
                conversationType: detail.conversationType,
                messageId: detail.message.message_id,
                unreadCount: detail.unreadCount,
                title,
                body,
                decryptedMessage: serializeMessage(detail.message),
            };

            void showNotification({
                title,
                options: {
                    body,
                    icon: publicAssetSrc("icon-192x192.png"),
                    badge: publicAssetSrc("icon-192x192.png"),
                    tag: `chat-message-${detail.message.message_id}`,
                    renotify: true,
                    data: notificationData,
                },
                registrationRef,
            });
        };

        window.addEventListener(CHAT_MESSAGE_NOTIFICATION_EVENT, handleNewMessage);

        return () => {
            window.removeEventListener(
                CHAT_MESSAGE_NOTIFICATION_EVENT,
                handleNewMessage
            );
        };
    }, []);

    return null;
}
