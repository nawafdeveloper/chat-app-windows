import { useCallback } from "react";
import { authClient } from "../lib/auth-client";
import { useActiveChatStore } from "../store/use-active-chat-store";
import type { Message } from "../types/messages.type";

type MessageFlagResponse = {
    messageId: string;
    userIdsPinIt: string[] | null;
    userIdsStarIt: string[] | null;
    updatedAt: string;
};

function withUserFlag(
    userIds: string[] | null | undefined,
    userId: string,
    enabled: boolean
) {
    const nextUserIds = new Set((userIds ?? []).filter(Boolean));

    if (enabled) {
        nextUserIds.add(userId);
    } else {
        nextUserIds.delete(userId);
    }

    return nextUserIds.size > 0 ? [...nextUserIds] : null;
}

export function useMessageActions() {
    const { data: session } = authClient.useSession();
    const updateMessage = useActiveChatStore((state) => state.updateMessage);

    const updateMessageFlag = useCallback(
        async ({
            message,
            action,
            enabled,
        }: {
            message: Message;
            action: "star" | "pin";
            enabled: boolean;
        }) => {
            const currentUserId = session?.user.id;

            if (!currentUserId) {
                return false;
            }

            const previousPinIds = message.user_ids_pin_it ?? null;
            const previousStarIds = message.user_ids_star_it ?? null;
            const optimisticPinIds =
                action === "pin"
                    ? withUserFlag(previousPinIds, currentUserId, enabled)
                    : previousPinIds;
            const optimisticStarIds =
                action === "star"
                    ? withUserFlag(previousStarIds, currentUserId, enabled)
                    : previousStarIds;

            updateMessage(message.chat_room_id, message.message_id, (current) => ({
                ...current,
                user_ids_pin_it: optimisticPinIds,
                user_ids_star_it: optimisticStarIds,
                updated_at: new Date(),
            }));

            try {
                const response = await fetch("https://halabakk-web.nawaf-alhasosah.workers.dev/api/messages", {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        action,
                        chatRoomId: message.chat_room_id,
                        messageId: message.message_id,
                        ...(action === "star"
                            ? { starred: enabled }
                            : { pinned: enabled }),
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Failed to ${action} message`);
                }

                const payload = (await response.json()) as MessageFlagResponse;
                const updatedAt = new Date(payload.updatedAt);

                updateMessage(message.chat_room_id, message.message_id, (current) => ({
                    ...current,
                    user_ids_pin_it: payload.userIdsPinIt,
                    user_ids_star_it: payload.userIdsStarIt,
                    updated_at: Number.isNaN(updatedAt.getTime())
                        ? current.updated_at
                        : updatedAt,
                }));
                if (action === "pin") {
                    window.dispatchEvent(
                        new CustomEvent("chat-room:pin-flags-updated", {
                            detail: {
                                chatId: message.chat_room_id,
                                messageId: message.message_id,
                            },
                        })
                    );
                }

                return true;
            } catch {
                updateMessage(message.chat_room_id, message.message_id, (current) => ({
                    ...current,
                    user_ids_pin_it: previousPinIds,
                    user_ids_star_it: previousStarIds,
                }));

                return false;
            }
        },
        [session?.user.id, updateMessage]
    );

    return {
        starMessage: (message: Message, starred: boolean) =>
            updateMessageFlag({ message, action: "star", enabled: starred }),
        pinMessage: (message: Message, pinned: boolean) =>
            updateMessageFlag({ message, action: "pin", enabled: pinned }),
    };
}
