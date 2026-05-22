import { useEffect, useMemo } from "react";
import { useCryptoKeys } from "../context/crypto";
import { authClient } from "../lib/auth-client";
import { shareEncryptedProfileImageWithRecipients } from "../lib/profile-image-upload";
import { shareEncryptedTextWithRecipients } from "../lib/text-encryption";
import { isManagedProfileImageUrl } from "../lib/profile-image-url";
import { useActiveChatStore } from "../store/use-active-chat-store";
import { useDecryptedContacts } from "../hooks/use-decrypted-contacts";

const syncedProfileImageKeys = new Set<string>();
const syncedAboutKeys = new Set<string>();

export function useSyncProfileImageRecipients() {
    const { isReady } = useCryptoKeys();
    const { data: session } = authClient.useSession();
    const { contacts } = useDecryptedContacts();
    const chats = useActiveChatStore((state) => state.chats);
    const currentUserId = session?.user.id ?? null;
    const profileImageUrl = session?.user.image ?? "";
    const aboutCiphertext =
        (session?.user as { aboutCiphertext?: string | null } | undefined)
            ?.aboutCiphertext ?? "";
    const aboutEncryptedAesKey =
        (session?.user as { aboutEncryptedAesKey?: string | null } | undefined)
            ?.aboutEncryptedAesKey ?? "";
    const recipients = useMemo(() => {
        const recipientPublicKeys = new Map<string, string>();

        for (const contact of contacts) {
            if (
                contact.linked_user_id &&
                contact.linked_user_id !== currentUserId &&
                contact.linked_user_public_key
            ) {
                recipientPublicKeys.set(
                    contact.linked_user_id,
                    contact.linked_user_public_key
                );
            }
        }

        for (const chat of chats) {
            if (
                chat.chat_type === "single" &&
                chat.recipient_user_id &&
                chat.recipient_user_id !== currentUserId &&
                chat.recipient_public_key
            ) {
                recipientPublicKeys.set(
                    chat.recipient_user_id,
                    chat.recipient_public_key
                );
            }
        }

        return [...recipientPublicKeys].map(([recipientUserId, publicKey]) => ({
            recipientUserId,
            publicKey,
        }));
    }, [chats, contacts, currentUserId]);

    useEffect(() => {
        if (
            !isReady ||
            !currentUserId ||
            !isManagedProfileImageUrl(profileImageUrl) ||
            recipients.length === 0
        ) {
            return;
        }

        const syncKey = `${profileImageUrl}:${recipients
            .map((recipient) => recipient.recipientUserId)
            .sort()
            .join(",")}`;
        if (syncedProfileImageKeys.has(syncKey)) {
            return;
        }

        syncedProfileImageKeys.add(syncKey);
        void shareEncryptedProfileImageWithRecipients(profileImageUrl, recipients).catch(
            () => {
                syncedProfileImageKeys.delete(syncKey);
            }
        );
    }, [currentUserId, isReady, profileImageUrl, recipients]);

    useEffect(() => {
        if (
            !isReady ||
            !currentUserId ||
            !aboutCiphertext ||
            !aboutEncryptedAesKey ||
            recipients.length === 0
        ) {
            return;
        }

        const syncKey = `${aboutCiphertext}:${aboutEncryptedAesKey}:${recipients
            .map((recipient) => recipient.recipientUserId)
            .sort()
            .join(",")}`;
        if (syncedAboutKeys.has(syncKey)) {
            return;
        }

        syncedAboutKeys.add(syncKey);
        void shareEncryptedTextWithRecipients({
            ownerUserId: currentUserId,
            encryptedAesKey: aboutEncryptedAesKey,
            recipients,
        })
            .then(async (nextEncryptedAesKey) => {
                if (!nextEncryptedAesKey) {
                    return;
                }

                const { error } = await authClient.updateUser({
                    aboutEncryptedAesKey: nextEncryptedAesKey,
                });

                if (error) {
                    syncedAboutKeys.delete(syncKey);
                }
            })
            .catch(() => {
                syncedAboutKeys.delete(syncKey);
            });
    }, [
        aboutCiphertext,
        aboutEncryptedAesKey,
        currentUserId,
        isReady,
        recipients,
    ]);
}
