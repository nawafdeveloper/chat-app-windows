import { Message } from "../types/messages.type";
import {
    DeleteForeverOutlined,
    InsertDriveFileOutlined,
    ImageOutlined,
    Person,
    PushPinOutlined,
    VideocamRounded,
    KeyboardVoiceOutlined,
    PushPin,
} from "@mui/icons-material";
import { IconButton, Typography } from "@mui/material";

type Props = {
    pinnedMessage: Message;
    onOpen: () => void;
    onUnpin?: () => void;
};

function getPinnedMessageLabel(message: Message) {
    if (message.message_text_content?.trim()) {
        return message.message_text_content;
    }

    switch (message.attached_media) {
        case "photo":
            return "Photo";
        case "video":
            return "Video";
        case "voice":
            return "Voice message";
        case "file":
            return message.media_file_name ?? "File";
        case "contact":
            return message.contact?.contact_name ?? "Contact";
        default:
            return "Pinned message";
    }
}

function getPinnedMessageIcon(message: Message) {
    switch (message.attached_media) {
        case "photo":
            return <ImageOutlined fontSize="inherit" />;
        case "video":
            return <VideocamRounded fontSize="inherit" />;
        case "voice":
            return <KeyboardVoiceOutlined fontSize="inherit" />;
        case "file":
            return <InsertDriveFileOutlined fontSize="inherit" />;
        case "contact":
            return <Person fontSize="inherit" />;
        default:
            return <PushPinOutlined fontSize="inherit" />;
    }
}

export default function ChatRoomPinContent({
    pinnedMessage,
    onOpen,
    onUnpin,
}: Props) {
    return (
        <button
            type="button"
            onClick={onOpen}
            className="absolute top-0 left-0 right-0 z-40 flex cursor-pointer flex-row items-center justify-between bg-white/70 backdrop-blur-sm px-4 py-3 duration-150 hover:bg-neutral-50/70 hover:backdrop-blur-sm dark:bg-[#161717bb] dark:hover:bg-[#1d1e1eb5] border-t dark:border-t-neutral-800 border-t-neutral-200"
        >
            <div className="flex min-w-0 flex-row items-center gap-x-2">
                <div className="justify-center items-center px-1.5 py-1 rounded-lg dark:bg-neutral-700 bg-neutral-200">
                    <PushPin fontSize="small" className="shrink-0" />
                </div>
                <Typography
                    variant="body1"
                    sx={{
                        minWidth: 0,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        textAlign: "left",
                    }}
                >
                    {getPinnedMessageLabel(pinnedMessage || null)}
                </Typography>
            </div>
            {onUnpin ? (
                <IconButton
                    size="small"
                    onClick={(event) => {
                        event.stopPropagation();
                        onUnpin();
                    }}
                >
                    <DeleteForeverOutlined fontSize="inherit" />
                </IconButton>
            ) : null}
        </button>
    );
}
