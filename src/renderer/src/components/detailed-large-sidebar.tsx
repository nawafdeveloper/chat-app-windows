import { useEffect, useMemo } from "react";
import { authClient } from "../lib/auth-client";
import {
    findContactByPhone,
    findContactByUserId,
    getContactDisplayName,
    resolveDirectChatContact,
} from "../lib/contact-display";
import {
    getChatDisplayName,
    resolveDirectChatPartner,
} from "../lib/chat-utils";
import { phoneValuesMatch } from "../lib/contact-utils";
import { getCachedMessageMedia } from "../lib/message-media-cache";
import { fetchAndDecryptMessageMedia } from "../lib/message-media-upload";
import { parseManagedMessageMediaUrl } from "../lib/message-media-url";
import {
    canViewAbout,
    canViewProfilePicture,
} from "../lib/profile-picture-privacy";
import { isManagedProfileImageUrl } from "../lib/profile-image-url";
import { useDecryptedContacts } from "../hooks/use-decrypted-contacts";
import { useDecryptedAboutText } from "../hooks/use-decrypted-about-text";
import { getLocaleFromCookie, isRTLClient } from "../lib/locale-client";
import { useActiveChatStore } from "../store/use-active-chat-store";
import { useDetailedSidebarStore } from "../store/use-detailed-sidebar-store";
import DetailedLargeSidebarHeader from "./detailed-large-sidebar-header";
import type { Message } from "../types/messages.type";
import { DetailedSidebarMediaItem } from "./detailed-sidebar-item-media";
import DetailedLargeSidebarContent from "./detailed-large-sidebar-content";
import type { Contact } from "../types/contacts.type";

const preloadingMediaObjectKeys = new Set<string>();
const EMPTY_MESSAGES: Message[] = [];

function isVisualMediaMessage(message: Message) {
    return (
        (message.attached_media === "photo" ||
            message.attached_media === "video") &&
        Boolean(message.media_url || message.media_preview_url)
    );
}

export default function DetailedLargeSidebar() {
    const { data: session } = authClient.useSession();
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const target = useDetailedSidebarStore((state) => state.target);
    const selectedChatId = useActiveChatStore((state) => state.selectedChatId);
    const chats = useActiveChatStore((state) => state.chats);
    const messagesByChatId = useActiveChatStore(
        (state) => state.messagesByChatId
    );
    const { contacts } = useDecryptedContacts();

    const currentPhone =
        (session?.user as { phoneNumber?: string | null } | undefined)
            ?.phoneNumber ?? null;
    const currentUserId = session?.user.id ?? null;
    const activeChatId = target?.chatId ?? selectedChatId;
    const activeChat =
        chats.find((chat) => chat.chat_id === activeChatId) ?? null;
    const targetUserId = target?.type === "user" ? target.userId : null;
    const targetGroupMember =
        targetUserId && activeChat?.chat_type === "group"
            ? activeChat.group_members?.find(
                  (member) => member.user_id === targetUserId
              ) ?? null
            : null;
    const targetMemberPhone = targetGroupMember?.phone_number ?? null;
    const directContact = activeChat
        ? resolveDirectChatContact(activeChat, contacts, currentPhone)
        : null;
    const targetContact =
        target?.type === "user"
            ? findContactByUserId(contacts, target.userId) ??
              findContactByPhone(contacts, targetMemberPhone)
            : directContact;
    const profileChat =
        target?.type === "user"
            ? chats.find((chat) => {
                  if (chat.chat_type !== "single") {
                      return false;
                  }

                  if (chat.recipient_user_id === target.userId) {
                      return true;
                  }

                  if (!targetMemberPhone) {
                      return false;
                  }

                  const directPartnerPhone = resolveDirectChatPartner(
                      chat.chat_id,
                      currentPhone
                  );

                  return (
                      Boolean(
                          chat.contact_phone &&
                              phoneValuesMatch(
                                  chat.contact_phone,
                                  targetMemberPhone
                              )
                      ) ||
                      Boolean(
                          directPartnerPhone &&
                              phoneValuesMatch(
                                  directPartnerPhone,
                                  targetMemberPhone
                              )
                      )
                  );
              }) ?? null
            : activeChat;
    const profileChatContact = profileChat
        ? resolveDirectChatContact(profileChat, contacts, currentPhone)
        : null;
    const detailChat = target?.type === "user" ? profileChat : activeChat;
    const detailChatId = detailChat?.chat_id ?? null;
    const messages = detailChatId
        ? messagesByChatId[detailChatId] ?? EMPTY_MESSAGES
        : EMPTY_MESSAGES;
    const targetPhone =
        target?.type === "user"
            ? targetContact?.contact_number ??
              targetMemberPhone ??
              profileChat?.contact_phone ??
              (profileChat
                  ? resolveDirectChatPartner(profileChat.chat_id, currentPhone)
                  : null)
            : null;
    const directTargetPhone =
        target?.type !== "user" && activeChat?.chat_type === "single"
            ? activeChat.contact_phone ??
              resolveDirectChatPartner(activeChat.chat_id, currentPhone)
            : null;
    const targetMessageContact: Contact | null =
        target?.type === "user"
            ? targetContact
                ? {
                      ...targetContact,
                      linked_user_id:
                          targetContact.linked_user_id ?? target.userId,
                      linked_user_public_key:
                          targetContact.linked_user_public_key ??
                          targetGroupMember?.public_key ??
                          undefined,
                  }
                : targetPhone
                  ? {
                        contact_id: `group-member-${target.userId}`,
                        linked_user_id: target.userId,
                        linked_user_public_key:
                            targetGroupMember?.public_key ?? undefined,
                        contact_first_name:
                            targetGroupMember?.name ?? targetPhone,
                        contact_number: targetPhone,
                        contact_avatar: targetGroupMember?.avatar ?? "",
                        contact_letter_group:
                            (targetGroupMember?.name ?? targetPhone)
                                .trim()
                                .charAt(0)
                                .toUpperCase() || "#",
                    }
                  : null
            : targetContact ??
              (activeChat?.chat_type === "single" && directTargetPhone
                  ? {
                        contact_id: `direct-${activeChat.chat_id}`,
                        linked_user_id: activeChat.recipient_user_id ?? undefined,
                        linked_user_public_key:
                            activeChat.recipient_public_key ?? undefined,
                        contact_first_name:
                            activeChat.display_name ?? directTargetPhone,
                        contact_number: directTargetPhone,
                        contact_avatar: activeChat.avatar ?? "",
                        contact_letter_group:
                            (activeChat.display_name ?? directTargetPhone)
                                .trim()
                                .charAt(0)
                                .toUpperCase() || "#",
                    }
                  : null);

    const mediaItems = useMemo<DetailedSidebarMediaItem[]>(
        () =>
            messages
                .filter(isVisualMediaMessage)
                .sort(
                    (left, right) =>
                        right.created_at.getTime() - left.created_at.getTime()
                )
                .map((message) => ({
                    id: message.message_id,
                    type: message.attached_media === "video" ? "video" : "photo",
                    mediaUrl: message.media_url,
                    previewUrl: message.media_preview_url ?? null,
                    createdAt: message.created_at,
                    senderUserId: message.sender_user_id,
                    senderDisplayName: (() => {
                        const senderContact = findContactByUserId(
                            contacts,
                            message.sender_user_id
                        );

                        return senderContact
                            ? getContactDisplayName(senderContact)
                            : message.sender_user_id;
                    })(),
                })),
        [contacts, messages]
    );

    const mediaCacheSignature = useMemo(
        () =>
            mediaItems
                .map((item) => item.mediaUrl ?? item.previewUrl ?? "")
                .join("|"),
        [mediaItems]
    );

    useEffect(() => {
        let isCancelled = false;

        const preloadLoadedMedia = async () => {
            for (const item of mediaItems) {
                const parsedMedia = parseManagedMessageMediaUrl(item.mediaUrl);

                if (
                    !parsedMedia ||
                    isCancelled ||
                    preloadingMediaObjectKeys.has(parsedMedia.objectKey)
                ) {
                    continue;
                }

                const cachedBlob = await getCachedMessageMedia(
                    parsedMedia.objectKey
                );
                if (cachedBlob || isCancelled) {
                    continue;
                }

                preloadingMediaObjectKeys.add(parsedMedia.objectKey);
                try {
                    await fetchAndDecryptMessageMedia(parsedMedia.objectKey);
                } catch {
                    // Individual media failures should not block the details panel.
                } finally {
                    preloadingMediaObjectKeys.delete(parsedMedia.objectKey);
                }
            }
        };

        void preloadLoadedMedia();

        return () => {
            isCancelled = true;
        };
    }, [mediaCacheSignature, mediaItems]);

    const contactName =
        target?.type === "user"
            ? targetContact
                ? getContactDisplayName(targetContact)
                : targetPhone ?? targetGroupMember?.name ?? target.userId
            : activeChat?.chat_type === "single" && targetContact
              ? getContactDisplayName(targetContact)
              : activeChat
                ? getChatDisplayName(activeChat, currentPhone)
                : null;
    const contactNumber =
        target?.type === "user"
            ? targetPhone
            : targetContact?.contact_number ??
              (activeChat?.chat_type === "single"
                  ? activeChat.contact_phone ??
                    resolveDirectChatPartner(activeChat.chat_id, currentPhone)
                  : null);
    const canShowChatAvatar =
        profileChat?.chat_type === "single" &&
        (profileChat.recipient_profile_picture_visible ??
            canViewProfilePicture(
                profileChat.recipient_who_can_see_profile_picture,
                Boolean(profileChatContact ?? targetContact)
            ));
    const canShowChatAbout =
        profileChat?.chat_type === "single" &&
        (profileChat.recipient_about_visible ??
            canViewAbout(
                profileChat.recipient_who_can_see_about,
                Boolean(profileChatContact ?? targetContact)
            ));
    const { aboutText } = useDecryptedAboutText({
        ciphertext: profileChat?.recipient_about_ciphertext,
        encryptedAesKey: profileChat?.recipient_about_encrypted_aes_key,
        iv: profileChat?.recipient_about_iv,
        enabled: canShowChatAbout,
    });
    const directContactAvatar =
        profileChatContact?.contact_avatar &&
        !isManagedProfileImageUrl(profileChatContact.contact_avatar)
            ? profileChatContact.contact_avatar
            : "";
    const avatar =
        target?.type === "user" && !profileChat
            ? targetContact?.contact_avatar ?? ""
            : profileChat?.chat_type === "single"
            ? canShowChatAvatar
                ? profileChat.avatar ||
                  directContactAvatar ||
                  targetContact?.contact_avatar ||
                  ""
                : ""
            : target?.type === "user"
              ? targetContact?.contact_avatar ?? ""
              : activeChat?.avatar ?? "";

    return (
        <div className="md:flex hidden flex-col w-full h-full bg-white dark:bg-[#161717] relative overflow-hidden border-t dark:border-neutral-700 border-neutral-300">
            <div
                className={`flex flex-col space-y-4 h-full max-h-full min-h-full w-full ${
                    isRTL ? "border-r" : "border-l"
                } dark:border-neutral-700 border-neutral-300 p-4 overflow-y-auto`}
            >
                <DetailedLargeSidebarHeader />
                <DetailedLargeSidebarContent
                    chatId={detailChat?.chat_id ?? null}
                    chatType={
                        target?.type === "user"
                            ? "single"
                            : activeChat?.chat_type ?? null
                    }
                    avatar={avatar}
                    contactName={contactName}
                    contactNumber={contactNumber}
                    biography={aboutText ?? targetContact?.contact_bio ?? null}
                    mediaCount={mediaItems.length}
                    mediaItems={mediaItems.slice(0, 4)}
                    muteNotification={
                        detailChat?.is_muted_chat_notifications ?? false
                    }
                    isBlocked={detailChat?.is_blocked_chat ?? false}
                    groupMembers={
                        target?.type === "user"
                            ? null
                            : activeChat?.group_members ?? null
                    }
                    currentUserId={currentUserId}
                    contacts={contacts}
                    contact={targetContact}
                    messageContact={targetMessageContact}
                />
            </div>
        </div>
    );
}
