import { ArchiveOutlined } from "@mui/icons-material";
import { CircularProgress, Typography } from "@mui/material";
import List from "@mui/material/List";
import { useMemo } from "react";
import ChatItem from "./chat-item";
import { getLocaleFromCookie, isRTLClient } from "../lib/locale-client";
import { useActiveChatStore } from "../store/use-active-chat-store";

export default function ArchiveSectionLargeSidebar() {
    const locale = getLocaleFromCookie();
    const isRTL = locale ? isRTLClient(locale) : false;
    const chats = useActiveChatStore((state) => state.chats);
    const chatsLoading = useActiveChatStore((state) => state.chatsLoading);
    const archivedChats = useMemo(
        () => chats.filter((chat) => chat.is_archived_chat),
        [chats]
    );

    return (
        <div
            className={`flex flex-col h-full max-h-full min-h-full w-full ${isRTL ? "border-l" : "border-r"} dark:border-neutral-700 border-neutral-300`}
        >
            <div className="px-5 pt-5 pb-3">
                <Typography
                    variant="h5"
                    sx={(theme) => ({
                        color: theme.palette.mode === "dark" ? "#ffffff" : "#000000",
                        fontWeight: 600,
                        textAlign: isRTL ? "right" : "left",
                    })}
                >
                    {isRTL ? "الأرشيف" : "Archive"}
                </Typography>
            </div>
            <List
                sx={{
                    bgcolor: "transparent",
                    overflowY: "scroll",
                    height: "100%",
                    paddingBottom: "24px",
                    paddingX: "20px",
                }}
            >
                {chatsLoading ? (
                    <div className="flex justify-center items-center h-full">
                        <CircularProgress
                            aria-label="Loading"
                            className="p-2 rounded-full shadow-sm dark:bg-[#1d1f1f] bg-[#f7f5f3] border dark:border-neutral-700 border-neutral-300"
                        />
                    </div>
                ) : archivedChats.length === 0 ? (
                    <label className="flex flex-col gap-y-4 text-start w-full md:max-w-xl md:mx-auto">
                        <p className="text-[#636261] dark:text-[#A5A5A5] leading-tight">
                            <ArchiveOutlined fontSize="inherit" />{" "}
                            {isRTL
                                ? "لا توجد محادثات مؤرشفة."
                                : "No archived chats yet."}
                        </p>
                    </label>
                ) : (
                    archivedChats.map((item) => (
                        <ChatItem key={item.chat_id} chat_item={item} />
                    ))
                )}
            </List>
        </div>
    );
}
