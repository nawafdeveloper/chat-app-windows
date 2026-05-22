import type { Message, ReplyMessage } from "../types/messages.type";

const REPLY_MEDIA_TYPES: NonNullable<ReplyMessage["original_attached_media"]>[] = [
    "photo",
    "video",
    "voice",
    "file",
    "contact",
    "location",
];

const REPLY_MEDIA_LABELS: Record<
    NonNullable<ReplyMessage["original_attached_media"]>,
    string
> = {
    photo: "Photo",
    video: "Video",
    voice: "Voice message",
    file: "Document",
    contact: "Contact",
    location: "Location",
};

export function createReplyMessageFromMessage(message: Message): ReplyMessage {
    return {
        original_message_id: message.message_id,
        original_sender_user_id: message.sender_user_id,
        original_message_text: message.message_text_content?.trim() || null,
        original_attached_media: message.attached_media,
        original_attached_media_url:
            message.media_preview_url ?? message.media_url ?? null,
    };
}

export function getReplyMessageLabel(reply: ReplyMessage | null | undefined) {
    if (!reply) {
        return "";
    }

    if (reply.original_message_text) {
        return reply.original_message_text;
    }

    if (reply.original_attached_media) {
        return REPLY_MEDIA_LABELS[reply.original_attached_media] ?? "Attachment";
    }

    return "Message";
}

export function normalizeReplyMessage(
    value: ReplyMessage | null | undefined
): ReplyMessage | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const candidate = value as Partial<Record<keyof ReplyMessage, unknown>>;
    const originalMessageId =
        typeof candidate.original_message_id === "string"
            ? candidate.original_message_id.trim()
            : "";
    const originalSenderUserId =
        typeof candidate.original_sender_user_id === "string"
            ? candidate.original_sender_user_id.trim()
            : "";

    if (!originalMessageId || !originalSenderUserId) {
        return null;
    }

    const originalAttachedMedia =
        typeof candidate.original_attached_media === "string" &&
        REPLY_MEDIA_TYPES.includes(
            candidate.original_attached_media as NonNullable<
                ReplyMessage["original_attached_media"]
            >
        )
            ? (candidate.original_attached_media as NonNullable<
                  ReplyMessage["original_attached_media"]
              >)
            : null;

    return {
        original_message_id: originalMessageId,
        original_sender_user_id: originalSenderUserId,
        original_message_text:
            typeof candidate.original_message_text === "string" &&
            candidate.original_message_text.trim()
                ? candidate.original_message_text.trim()
                : null,
        original_attached_media: originalAttachedMedia,
        original_attached_media_url:
            typeof candidate.original_attached_media_url === "string" &&
            candidate.original_attached_media_url.trim()
                ? candidate.original_attached_media_url.trim()
                : null,
    };
}
