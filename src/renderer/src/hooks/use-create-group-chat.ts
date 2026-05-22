import { useCallback, useState } from "react";
import { authClient } from "../lib/auth-client";
import {
    decryptChatPreviewBatch,
    encryptTextForRecipients,
} from "../lib/chat-e2ee";
import { normalizeChatItem } from "../lib/chat-utils";
import { getContactDisplayName } from "../lib/contact-display";
import { uploadEncryptedMessageMedia } from "../lib/message-media-upload";
import { useActiveChatStore } from "../store/use-active-chat-store";
import { useSidebarStore } from "../store/use-active-sidebar-store";
import { useSubsidebarStore } from "../store/use-active-subsidebar-store";
import { useGroupMembersSearchStore } from "../store/use-group-memeber-search-store";
import { useGroupSidebarStore } from "../store/use-group-sidebar-store";
import { useNewGroupStore } from "../store/use-new-group-store";
import type { ChatItemType } from "../types/chats.type";

const GROUP_CREATED_PREVIEW = "Group created";

type RawChatItem = Omit<ChatItemType, "created_at" | "updated_at"> & {
    created_at: string | Date;
    updated_at: string | Date;
};

type GroupRecipient = {
    userId: string;
    publicKey: string;
};

export function useCreateGroupChat() {
    const { data: session } = authClient.useSession();
    const selectedContacts = useNewGroupStore((state) => state.selectedContacts);
    const groupName = useNewGroupStore((state) => state.groupName);
    const groupAvatarFile = useNewGroupStore((state) => state.groupAvatarFile);
    const resetGroupStore = useNewGroupStore((state) => state.resetStore);
    const setGroupSidebarState = useGroupSidebarStore(
        (state) => state.setGroupSidebarState
    );
    const clearMemberSearch = useGroupMembersSearchStore(
        (state) => state.clearQuery
    );
    const setActiveSubsideBar = useSubsidebarStore(
        (state) => state.setActiveSubsideBar
    );
    const setActiveSideBar = useSidebarStore((state) => state.setActiveSideBar);
    const upsertChat = useActiveChatStore((state) => state.upsertChat);
    const setSelectedChatId = useActiveChatStore(
        (state) => state.setSelectedChatId
    );
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createGroupChat = useCallback(async () => {
        const currentUserId = session?.user.id;
        const currentPublicKey = (
            session?.user as { yhlaPublicKey?: string | null } | undefined
        )?.yhlaPublicKey;
        const trimmedName = groupName.trim();

        if (isCreating) {
            return false;
        }

        setError(null);

        if (!currentUserId || !currentPublicKey) {
            setError("Unlock your account keys before creating a group.");
            return false;
        }

        if (!trimmedName) {
            setError("Group name is required.");
            return false;
        }

        const missingEncryptionContact = selectedContacts.find(
            (contact) =>
                !contact.linked_user_id || !contact.linked_user_public_key
        );

        if (missingEncryptionContact) {
            setError(
                `${getContactDisplayName(
                    missingEncryptionContact
                )} has not set up encryption yet.`
            );
            return false;
        }

        const memberRecipients: GroupRecipient[] = selectedContacts.map(
            (contact) => ({
                userId: contact.linked_user_id!,
                publicKey: contact.linked_user_public_key!,
            })
        );

        if (memberRecipients.length === 0) {
            setError("Select at least one group member.");
            return false;
        }

        const recipients: GroupRecipient[] = [
            {
                userId: currentUserId,
                publicKey: currentPublicKey,
            },
            ...memberRecipients,
        ];

        setIsCreating(true);

        try {
            const avatarUrl = groupAvatarFile
                ? (
                      await uploadEncryptedMessageMedia(
                          groupAvatarFile,
                          recipients.map((recipient) => ({
                              recipientUserId: recipient.userId,
                              publicKey: recipient.publicKey,
                          })),
                          null
                      )
                  ).mediaUrl
                : "";
            const encryptedPreview = await encryptTextForRecipients(
                GROUP_CREATED_PREVIEW,
                recipients
            );
            const response = await fetch("https://halabakk-web.nawaf-alhasosah.workers.dev//api/chats", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: trimmedName,
                    avatar: avatarUrl,
                    memberUserIds: memberRecipients.map(
                        (recipient) => recipient.userId
                    ),
                    encryptedChatPreview: encryptedPreview.encryptedContent,
                    chatPreviewRecipientKeys:
                        encryptedPreview.recipientEncryptionKeys,
                }),
            });

            if (!response.ok) {
                const payload = (await response.json().catch(() => null)) as {
                    error?: string;
                } | null;

                throw new Error(payload?.error ?? "Failed to create group.");
            }

            const payload = (await response.json()) as { chat: RawChatItem };
            const normalizedChat = normalizeChatItem(payload.chat);
            const [decryptedChat] = await decryptChatPreviewBatch({
                chats: [normalizedChat],
                currentUserId,
            });
            const nextChat = {
                ...decryptedChat,
                last_message_context:
                    decryptedChat.last_message_context || GROUP_CREATED_PREVIEW,
            };

            upsertChat(nextChat);
            setSelectedChatId(nextChat.chat_id);
            resetGroupStore();
            clearMemberSearch();
            setGroupSidebarState(false);
            setActiveSubsideBar(null);
            setActiveSideBar("main-chat");

            return true;
        } catch (nextError) {
            setError(
                nextError instanceof Error
                    ? nextError.message
                    : "Failed to create group."
            );
            return false;
        } finally {
            setIsCreating(false);
        }
    }, [
        clearMemberSearch,
        groupAvatarFile,
        groupName,
        isCreating,
        resetGroupStore,
        selectedContacts,
        session,
        setActiveSideBar,
        setActiveSubsideBar,
        setGroupSidebarState,
        setSelectedChatId,
        upsertChat,
    ]);

    return {
        createGroupChat,
        isCreating,
        error,
    };
}
