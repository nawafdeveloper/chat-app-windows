import { useCallback, useState } from "react";
import { electronApiFetch } from "../lib/electron-api-fetch";
import { useActiveChatStore } from "../store/use-active-chat-store";
import type { ChatItemType } from "../types/chats.type";

type ChatPreferenceKey =
    | "is_archived_chat"
    | "is_muted_chat_notifications"
    | "is_pinned_chat"
    | "is_favourite_chat"
    | "is_blocked_chat";

const preferenceRequestKeys: Record<ChatPreferenceKey, string> = {
    is_archived_chat: "isArchived",
    is_muted_chat_notifications: "isMuted",
    is_pinned_chat: "isPinned",
    is_favourite_chat: "isFavourite",
    is_blocked_chat: "isBlocked",
};

async function patchChatAction(body: Record<string, unknown>) {
    const response = await electronApiFetch("/api/chats", {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        throw new Error("Failed to update chat.");
    }
}

export function useChatMenuActions() {
    const upsertChat = useActiveChatStore((state) => state.upsertChat);
    const removeChat = useActiveChatStore((state) => state.removeChat);
    const markChatRead = useActiveChatStore((state) => state.markChatRead);
    const [isUpdating, setIsUpdating] = useState(false);

    const setChatPreference = useCallback(
        async (
            chatId: string,
            key: ChatPreferenceKey,
            value: boolean
        ) => {
            const chat =
                useActiveChatStore
                    .getState()
                    .chats.find((item) => item.chat_id === chatId) ?? null;

            if (!chat) {
                return false;
            }

            const previousChat = chat;
            upsertChat({
                ...chat,
                [key]: value,
            });
            setIsUpdating(true);

            try {
                await patchChatAction({
                    chatId,
                    [preferenceRequestKeys[key]]: value,
                });
                return true;
            } catch {
                upsertChat(previousChat);
                return false;
            } finally {
                setIsUpdating(false);
            }
        },
        [upsertChat]
    );

    const deleteChatForCurrentUser = useCallback(
        async (chatId: string) => {
            const chat =
                useActiveChatStore
                    .getState()
                    .chats.find((item) => item.chat_id === chatId) ?? null;

            if (!chat) {
                return false;
            }

            removeChat(chatId);
            setIsUpdating(true);

            try {
                await patchChatAction({
                    chatId,
                    isDeleted: true,
                });
                return true;
            } catch {
                upsertChat(chat);
                return false;
            } finally {
                setIsUpdating(false);
            }
        },
        [removeChat, upsertChat]
    );

    const markChatAsRead = useCallback(
        async (chatId: string) => {
            const chat =
                useActiveChatStore
                    .getState()
                    .chats.find((item) => item.chat_id === chatId) ?? null;

            if (!chat) {
                return false;
            }

            const previousChat: ChatItemType = chat;
            markChatRead(chatId);
            setIsUpdating(true);

            try {
                await patchChatAction({
                    chatId,
                    markRead: true,
                });
                return true;
            } catch {
                upsertChat(previousChat);
                return false;
            } finally {
                setIsUpdating(false);
            }
        },
        [markChatRead, upsertChat]
    );

    return {
        isUpdating,
        setChatPreference,
        deleteChatForCurrentUser,
        markChatAsRead,
    };
}
