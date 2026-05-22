import { useCallback, useState } from "react";
import { authClient } from "../lib/auth-client";
import { decryptMessageBatch } from "../lib/chat-e2ee";
import { fetchAndDecryptMessageMedia } from "../lib/message-media-upload";
import { useSendChatMessage } from "../hooks/use-send-chat-message";
import type { Contact as DirectoryContact } from "../types/contacts.type";
import type { Message } from "../types/messages.type";

type ForwardableMediaType = Extract<
    Message["attached_media"],
    "photo" | "video" | "voice" | "file"
>;

const FORWARDABLE_MEDIA_TYPES = new Set<ForwardableMediaType>([
    "photo",
    "video",
    "voice",
    "file",
]);

function isForwardableMediaType(
    attachedMedia: Message["attached_media"]
): attachedMedia is ForwardableMediaType {
    return Boolean(
        attachedMedia && FORWARDABLE_MEDIA_TYPES.has(attachedMedia as ForwardableMediaType)
    );
}

function buildForwardFile(message: Message, blob: Blob) {
    const fallbackName =
        message.attached_media === "photo"
            ? "forwarded-image"
            : message.attached_media === "video"
              ? "forwarded-video"
              : message.attached_media === "voice"
                ? "forwarded-voice"
                : "forwarded-file";
    const fileName =
        message.media_file_name ||
        message.client_local_media_name ||
        fallbackName;

    return new File([blob], fileName, {
        type:
            blob.type ||
            message.client_local_media_mime_type ||
            "application/octet-stream",
    });
}

function buildForwardContact(
    contact: NonNullable<Message["contact"]>
): DirectoryContact {
    return {
        contact_id: contact.contact_id,
        contact_first_name: contact.contact_name,
        contact_second_name: "",
        contact_number: contact.contact_phone ?? "",
        contact_avatar: contact.contact_image,
        linked_user_id: contact.linked_user_id ?? undefined,
        contact_letter_group: "",
    };
}

export function useForwardMessages() {
    const { data: session } = authClient.useSession();
    const { sendMessage, sendAttachment, sendContact } = useSendChatMessage();
    const [isForwarding, setIsForwarding] = useState(false);

    const forwardMessages = useCallback(
        async ({
            messages,
            targetChatIds,
        }: {
            messages: Message[];
            targetChatIds: string[];
        }) => {
            const currentUserId = session?.user.id;
            const uniqueMessages = [...new Map(messages.map((message) => [message.message_id, message])).values()];
            const uniqueTargetChatIds = [...new Set(targetChatIds)].filter(Boolean);

            if (!currentUserId || uniqueMessages.length === 0 || uniqueTargetChatIds.length === 0) {
                return false;
            }

            setIsForwarding(true);

            try {
                const decryptedMessages = await decryptMessageBatch({
                    currentUserId,
                    messages: uniqueMessages,
                });

                for (const targetChatId of uniqueTargetChatIds) {
                    for (const message of decryptedMessages) {
                        const text = message.message_text_content?.trim() ?? "";

                        if (message.attached_media === "contact" && message.contact) {
                            const didSend = await sendContact({
                                contact: buildForwardContact(message.contact),
                                chatId: targetChatId,
                                isForwardMessage: true,
                            });

                            if (!didSend) {
                                return false;
                            }

                            continue;
                        }

                        if (
                            isForwardableMediaType(message.attached_media)
                        ) {
                            if (!message.media_url) {
                                return false;
                            }

                            const mediaBlob = await fetchAndDecryptMessageMedia(
                                message.media_url
                            );
                            const didSend = await sendAttachment({
                                file: buildForwardFile(message, mediaBlob),
                                attachedMedia: message.attached_media,
                                chatId: targetChatId,
                                text: text || null,
                                isForwardMessage: true,
                            });

                            if (!didSend) {
                                return false;
                            }

                            continue;
                        }

                        if (!text) {
                            return false;
                        }

                        const didSend = await sendMessage({
                            text,
                            chatId: targetChatId,
                            clearDraft: false,
                            openGraphData: message.open_graph_data,
                            isForwardMessage: true,
                        });

                        if (!didSend) {
                            return false;
                        }
                    }
                }

                return true;
            } finally {
                setIsForwarding(false);
            }
        },
        [sendAttachment, sendContact, sendMessage, session?.user.id]
    );

    return {
        forwardMessages,
        isForwarding,
    };
}
