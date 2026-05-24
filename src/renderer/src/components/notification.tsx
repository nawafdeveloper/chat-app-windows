import { useEffect, useRef } from "react";
import { authClient } from "../lib/auth-client";
import {
    CHAT_MESSAGE_NOTIFICATION_EVENT,
    getMessageNotificationPreview,
    type ChatMessageNotificationEventDetail,
} from "../lib/message-notifications";
import { publicAssetSrc } from "../lib/public-assets";
import { useActiveChatStore } from "../store/use-active-chat-store";

type NotificationUser = {
    id?: string;
    disableMessagesNotifications?: boolean | null;
    disableGroupsNotifications?: boolean | null;
};

const NOTIFICATION_SOUND_SRC = publicAssetSrc(
    "universfield-new-notification-07-210334.mp3"
);

function playNotificationSound(audio: HTMLAudioElement | null) {
    if (!audio) {
        return;
    }

    audio.currentTime = 0;
    void audio.play().catch(() => {
        // Electron can still block autoplay before the first user interaction.
    });
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

export default function Notification() {
    const { data: session } = authClient.useSession();
    const setSelectedChatId = useActiveChatStore((state) => state.setSelectedChatId);
    const sessionUserRef = useRef<NotificationUser | null>(null);
    const shownMessageIdsRef = useRef<Set<string>>(new Set());
    const notificationSoundRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        sessionUserRef.current = (session?.user as NotificationUser | undefined) ?? null;
    }, [session]);

    useEffect(() => {
        const audio = new Audio(NOTIFICATION_SOUND_SRC);
        audio.preload = "auto";
        notificationSoundRef.current = audio;

        return () => {
            audio.pause();
            notificationSoundRef.current = null;
        };
    }, []);

    useEffect(() => {
        return window.electronAPI?.onNativeNotificationClick((payload) => {
            if (payload.conversationId) {
                setSelectedChatId(payload.conversationId);
            }
        });
    }, [setSelectedChatId]);

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
            playNotificationSound(notificationSoundRef.current);
            void window.electronAPI?.showNativeNotification({
                title,
                body,
                id: detail.message.message_id,
                tag: `chat-message-${detail.message.message_id}`,
                conversationId: detail.conversationId,
                conversationType: detail.conversationType,
                messageId: detail.message.message_id,
                unreadCount: detail.unreadCount,
                silent: true,
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
