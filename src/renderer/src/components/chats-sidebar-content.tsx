import { CircularProgress } from "@mui/material";
import List from "@mui/material/List";
import ChatItem from "./chat-item";
import { TransitionGroup } from 'react-transition-group';
import Collapse from "@mui/material/Collapse";
import { useActiveChatStore } from "../store/use-active-chat-store";
import { useMemo } from "react";
import { getLocaleFromCookie, isRTLClient } from "../lib/locale-client";
import { AddCommentOutlined } from "@mui/icons-material";
import { authClient } from "../lib/auth-client";
import { getChatDisplayName } from "../lib/chat-utils";
import {
    getContactDisplayName,
    resolveDirectChatContact,
} from "../lib/contact-display";
import { useDecryptedContacts } from "../hooks/use-decrypted-contacts";

type Props = {
    activeChatTab: "all" | "unread" | "favourites" | "groups";
    searchQuery: string;
}

export default function ChatsSideBarContent({ activeChatTab, searchQuery }: Props) {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const { data: session } = authClient.useSession();
    const { contacts } = useDecryptedContacts();

    const chats = useActiveChatStore((state) => state.chats);
    const chatsLoading = useActiveChatStore((state) => state.chatsLoading);
    const isSearching = searchQuery.trim().length > 0;

    const filteredChats = useMemo(() => {
        const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
        const currentPhone = (session?.user as { phoneNumber?: string | null } | undefined)
            ?.phoneNumber ?? null;
        const visibleChats = chats.filter((chat) => !chat.is_archived_chat);

        const tabFilteredChats = (() => {
            switch (activeChatTab) {
            case "unread":
                return visibleChats.filter((chat) => chat.unreaded_messages_length > 0);
            case "favourites":
                return visibleChats.filter((chat) => chat.is_favourite_chat);
            case "groups":
                return visibleChats.filter((chat) => chat.chat_type === "group");
            default:
                return visibleChats;
            }
        })();

        if (!normalizedQuery) {
            return tabFilteredChats;
        }

        return tabFilteredChats.filter((chat) => {
            const directContact = resolveDirectChatContact(chat, contacts, currentPhone);
            const chatTitle =
                chat.chat_type === "single" && directContact
                    ? getContactDisplayName(directContact)
                    : getChatDisplayName(chat, currentPhone);
            const groupMemberSearchValues =
                chat.group_members?.flatMap((member) => [
                    member.name,
                    member.phone_number,
                    member.user_id,
                ]) ?? [];

            return [
                chatTitle,
                chat.display_name,
                chat.contact_phone,
                chat.chat_id,
                chat.last_message_context,
                chat.last_message_sender_nickname,
                ...groupMemberSearchValues,
            ].some((value) =>
                value?.toLocaleLowerCase().includes(normalizedQuery)
            );
        });
    }, [activeChatTab, chats, contacts, searchQuery, session?.user]);

    return (
        <List sx={{ bgcolor: 'transparent', overflowY: "scroll", height: "100%", paddingBottom: '24px', paddingX: '20px' }}>
            {chatsLoading ? (
                <div className="flex justify-center items-center h-full">
                    <CircularProgress aria-label="Loading…" className="p-2 rounded-full shadow-sm dark:bg-[#1d1f1f] bg-[#f7f5f3] border dark:border-neutral-700 border-neutral-300" />
                </div>
            ) : filteredChats.length === 0 ? (
                isSearching ? (
                    <label className='flex flex-col gap-y-4 text-start w-full md:max-w-xl md:mx-auto'>
                        <p className='text-[#636261] dark:text-[#A5A5A5]'>
                            {isRTL ? 'لا توجد محادثات مطابقة.' : 'No chats found.'}
                        </p>
                    </label>
                ) : (
                <label className='flex flex-col gap-y-4 text-start w-full md:max-w-xl md:mx-auto'>
                    <p className='text-[#636261] dark:text-[#A5A5A5]'>
                        {isRTL ? 'ابدأ محادثة جديدة بالضغط على زر' : 'Start a new conversation by tapping the'}
                        {' '}
                        <AddCommentOutlined fontSize="inherit" />
                        {' '}
                        {isRTL ? 'وتواصل مع أصدقائك أو جهات اتصالك.' : 'button and connect with your friends or contacts.'}
                    </p>
                </label>
                )
            ) : (
                <TransitionGroup>
                    {filteredChats.map((item) => (
                        <Collapse key={item.chat_id}>
                            <ChatItem
                                key={item.chat_id}
                                chat_item={item}
                            />
                        </Collapse>
                    ))}
                </TransitionGroup>
            )}
        </List>
    )
}
