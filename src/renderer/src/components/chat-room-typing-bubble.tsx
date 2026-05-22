import { Person } from "@mui/icons-material";
import { Avatar, Card, ListItem, ListItemButton } from "@mui/material";
import { useActiveChatStore } from "../store/use-active-chat-store";

const TAIL_WIDTH = 8;

export default function ChatRoomTypingBubble() {
    const selectedChatId = useActiveChatStore((state) => state.selectedChatId);
    const chats = useActiveChatStore((state) => state.chats);
    const typingByChatId = useActiveChatStore((state) => state.typingByChatId);

    if (!selectedChatId) {
        return null;
    }

    const activeTypingUsers =
        typingByChatId[selectedChatId]?.activeTypingUsers ?? [];
    if (activeTypingUsers.length === 0) {
        return null;
    }

    const selectedChat =
        chats.find((chat) => chat.chat_id === selectedChatId) ?? null;
    const isGroupChat = selectedChat?.chat_type === "group";

    return (
        <ListItem disablePadding>
            <ListItemButton
                dir="ltr"
                disableRipple
                disableTouchRipple
                sx={{
                    cursor: "default",
                    "&:hover": { backgroundColor: "transparent" },
                }}
            >
                <div className="flex flex-row items-center w-full md:max-w-7xl md:mx-auto gap-x-3">
                    <div className="flex flex-row items-start">
                        {isGroupChat && (
                            <div
                                style={{
                                    width: 34,
                                    flexShrink: 0,
                                    alignSelf: "flex-start",
                                    marginRight: 4,
                                }}
                            >
                                <Avatar
                                    sx={(theme) => ({
                                        width: 34,
                                        height: 34,
                                        backgroundColor:
                                            theme.palette.mode === "dark"
                                                ? "#1c2a1f"
                                                : "#E8F5E9",
                                        color:
                                            theme.palette.mode === "dark"
                                                ? "#9CCC65"
                                                : "#2E7D32",
                                    })}
                                >
                                    <Person fontSize="small" />
                                </Avatar>
                            </div>
                        )}
                        <span
                            className="text-white dark:text-[#222424]"
                            aria-hidden="true"
                            data-icon="tail-in"
                        >
                            <svg
                                viewBox="0 0 8 13"
                                height="13"
                                width={TAIL_WIDTH}
                                preserveAspectRatio="xMidYMid meet"
                                version="1.1"
                                x="0px"
                                y="0px"
                                enableBackground="new 0 0 8 13"
                            >
                                <title>tail-in</title>
                                <path
                                    opacity="0.13"
                                    fill="currentColor"
                                    d="M1.533,3.568L8,12.193V1H2.812 C1.042,1,0.474,2.156,1.533,3.568z"
                                ></path>
                                <path
                                    fill="currentColor"
                                    d="M1.533,2.568L8,11.193V0L2.812,0C1.042,0,0.474,1.156,1.533,2.568z"
                                ></path>
                            </svg>
                        </span>
                        <Card
                            sx={(theme) => ({
                                minWidth: 64,
                                px: 1.5,
                                py: 1.1,
                                borderTopLeftRadius: 0,
                                borderTopRightRadius: 7,
                                borderBottomRightRadius: 7,
                                borderBottomLeftRadius: 7,
                                boxShadow: "0px 2px 0px rgba(0,0,0,0.09)",
                                backgroundColor:
                                    theme.palette.mode === "dark"
                                        ? "#222424"
                                        : "#FFFFFF",
                                color:
                                    theme.palette.mode === "dark"
                                        ? "#ffffff"
                                        : "#000000",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                            })}
                        >
                            <svg
                                fill="currentColor"
                                viewBox="0 0 24 24"
                                xmlns="http://www.w3.org/2000/svg"
                                width="24"
                                height="24"
                                aria-label="Typing"
                            >
                                <circle cx="4" cy="12" r="0">
                                    <animate
                                        begin="0;spinner_z0Or.end"
                                        attributeName="r"
                                        calcMode="spline"
                                        dur="0.5s"
                                        keySplines=".36,.6,.31,1"
                                        values="0;3"
                                        fill="freeze"
                                    />
                                    <animate
                                        begin="spinner_OLMs.end"
                                        attributeName="cx"
                                        calcMode="spline"
                                        dur="0.5s"
                                        keySplines=".36,.6,.31,1"
                                        values="4;12"
                                        fill="freeze"
                                    />
                                    <animate
                                        begin="spinner_UHR2.end"
                                        attributeName="cx"
                                        calcMode="spline"
                                        dur="0.5s"
                                        keySplines=".36,.6,.31,1"
                                        values="12;20"
                                        fill="freeze"
                                    />
                                    <animate
                                        id="spinner_lo66"
                                        begin="spinner_Aguh.end"
                                        attributeName="r"
                                        calcMode="spline"
                                        dur="0.5s"
                                        keySplines=".36,.6,.31,1"
                                        values="3;0"
                                        fill="freeze"
                                    />
                                    <animate
                                        id="spinner_z0Or"
                                        begin="spinner_lo66.end"
                                        attributeName="cx"
                                        dur="0.001s"
                                        values="20;4"
                                        fill="freeze"
                                    />
                                </circle>
                                <circle cx="4" cy="12" r="3">
                                    <animate
                                        begin="0;spinner_z0Or.end"
                                        attributeName="cx"
                                        calcMode="spline"
                                        dur="0.5s"
                                        keySplines=".36,.6,.31,1"
                                        values="4;12"
                                        fill="freeze"
                                    />
                                    <animate
                                        begin="spinner_OLMs.end"
                                        attributeName="cx"
                                        calcMode="spline"
                                        dur="0.5s"
                                        keySplines=".36,.6,.31,1"
                                        values="12;20"
                                        fill="freeze"
                                    />
                                    <animate
                                        id="spinner_JsnR"
                                        begin="spinner_UHR2.end"
                                        attributeName="r"
                                        calcMode="spline"
                                        dur="0.5s"
                                        keySplines=".36,.6,.31,1"
                                        values="3;0"
                                        fill="freeze"
                                    />
                                    <animate
                                        id="spinner_Aguh"
                                        begin="spinner_JsnR.end"
                                        attributeName="cx"
                                        dur="0.001s"
                                        values="20;4"
                                        fill="freeze"
                                    />
                                    <animate
                                        begin="spinner_Aguh.end"
                                        attributeName="r"
                                        calcMode="spline"
                                        dur="0.5s"
                                        keySplines=".36,.6,.31,1"
                                        values="0;3"
                                        fill="freeze"
                                    />
                                </circle>
                                <circle cx="12" cy="12" r="3">
                                    <animate
                                        begin="0;spinner_z0Or.end"
                                        attributeName="cx"
                                        calcMode="spline"
                                        dur="0.5s"
                                        keySplines=".36,.6,.31,1"
                                        values="12;20"
                                        fill="freeze"
                                    />
                                    <animate
                                        id="spinner_hSjk"
                                        begin="spinner_OLMs.end"
                                        attributeName="r"
                                        calcMode="spline"
                                        dur="0.5s"
                                        keySplines=".36,.6,.31,1"
                                        values="3;0"
                                        fill="freeze"
                                    />
                                    <animate
                                        id="spinner_UHR2"
                                        begin="spinner_hSjk.end"
                                        attributeName="cx"
                                        dur="0.001s"
                                        values="20;4"
                                        fill="freeze"
                                    />
                                    <animate
                                        begin="spinner_UHR2.end"
                                        attributeName="r"
                                        calcMode="spline"
                                        dur="0.5s"
                                        keySplines=".36,.6,.31,1"
                                        values="0;3"
                                        fill="freeze"
                                    />
                                    <animate
                                        begin="spinner_Aguh.end"
                                        attributeName="cx"
                                        calcMode="spline"
                                        dur="0.5s"
                                        keySplines=".36,.6,.31,1"
                                        values="4;12"
                                        fill="freeze"
                                    />
                                </circle>
                                <circle cx="20" cy="12" r="3">
                                    <animate
                                        id="spinner_4v5M"
                                        begin="0;spinner_z0Or.end"
                                        attributeName="r"
                                        calcMode="spline"
                                        dur="0.5s"
                                        keySplines=".36,.6,.31,1"
                                        values="3;0"
                                        fill="freeze"
                                    />
                                    <animate
                                        id="spinner_OLMs"
                                        begin="spinner_4v5M.end"
                                        attributeName="cx"
                                        dur="0.001s"
                                        values="20;4"
                                        fill="freeze"
                                    />
                                    <animate
                                        begin="spinner_OLMs.end"
                                        attributeName="r"
                                        calcMode="spline"
                                        dur="0.5s"
                                        keySplines=".36,.6,.31,1"
                                        values="0;3"
                                        fill="freeze"
                                    />
                                    <animate
                                        begin="spinner_UHR2.end"
                                        attributeName="cx"
                                        calcMode="spline"
                                        dur="0.5s"
                                        keySplines=".36,.6,.31,1"
                                        values="4;12"
                                        fill="freeze"
                                    />
                                    <animate
                                        begin="spinner_Aguh.end"
                                        attributeName="cx"
                                        calcMode="spline"
                                        dur="0.5s"
                                        keySplines=".36,.6,.31,1"
                                        values="12;20"
                                        fill="freeze"
                                    />
                                </circle>
                            </svg>
                        </Card>
                    </div>
                </div>
            </ListItemButton>
        </ListItem>
    );
}
