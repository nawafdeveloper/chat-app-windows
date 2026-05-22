import type { ChatItemType } from "../types/chats.type";
import type { Message } from "../types/messages.type";

export const CHAT_MESSAGE_NOTIFICATION_EVENT = "chat:message-notification";

export type ChatMessageNotificationEventDetail = {
    conversationId: string;
    conversationType: "direct" | "group";
    message: Message;
    chat: ChatItemType | null;
    unreadCount: number;
};

const ATTACHMENT_LABELS: Record<string, string> = {
    photo: "Photo",
    video: "Video",
    voice: "Voice message",
    file: "Document",
    contact: "Contact",
    location: "Location",
};

export function emitChatMessageNotification(
    detail: ChatMessageNotificationEventDetail
) {
    if (typeof window === "undefined") {
        return;
    }

    window.dispatchEvent(
        new CustomEvent<ChatMessageNotificationEventDetail>(
            CHAT_MESSAGE_NOTIFICATION_EVENT,
            { detail }
        )
    );
}

export function getMessageNotificationPreview(message: Message) {
    const text = message.message_text_content?.trim();
    if (text) {
        return text;
    }

    if (message.attached_media === "contact" && message.contact?.contact_name) {
        return `Contact: ${message.contact.contact_name}`;
    }

    if (message.attached_media) {
        return ATTACHMENT_LABELS[message.attached_media] ?? "Attachment";
    }

    return "New message";
}
