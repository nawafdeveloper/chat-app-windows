import { CircularProgress } from "@mui/material";
import List from "@mui/material/List";
import ChatItem from "./chat-item";
import { TransitionGroup } from 'react-transition-group';
import Collapse from "@mui/material/Collapse";
import { useActiveChatStore } from "../store/use-active-chat-store";
import { useMemo } from "react";
import { getLocaleFromCookie, isRTLClient } from "../lib/locale-client";
import { AddCommentOutlined } from "@mui/icons-material";

type Props = {
    activeChatTab: "all" | "unread" | "favourites" | "groups";
}

export default function ChatsSideBarContent({ activeChatTab }: Props) {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;

    const chats = useActiveChatStore((state) => state.chats);
    const chatsLoading = useActiveChatStore((state) => state.chatsLoading);

    const filteredChats = useMemo(() => {
        const visibleChats = chats.filter((chat) => !chat.is_archived_chat);

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
    }, [activeChatTab, chats]);

    return (
        <List sx={{ bgcolor: 'transparent', overflowY: "scroll", height: "100%", paddingBottom: '24px', paddingX: '20px' }}>
            {chatsLoading ? (
                <div className="flex justify-center items-center h-full">
                    <CircularProgress aria-label="Loading…" className="p-2 rounded-full shadow-sm dark:bg-[#1d1f1f] bg-[#f7f5f3] border dark:border-neutral-700 border-neutral-300" />
                </div>
            ) : filteredChats.length === 0 ? (
                <label className='flex flex-col gap-y-4 text-start w-full md:max-w-xl md:mx-auto'>
                    <p className='text-[#636261] dark:text-[#A5A5A5]'>
                        {isRTL ? 'ابدأ محادثة جديدة بالضغط على زر' : 'Start a new conversation by tapping the'}
                        {' '}
                        <AddCommentOutlined fontSize="inherit" />
                        {' '}
                        {isRTL ? 'وتواصل مع أصدقائك أو جهات اتصالك.' : 'button and connect with your friends or contacts.'}
                    </p>
                </label>
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
