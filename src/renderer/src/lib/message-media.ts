import type { Message } from "../types/messages.type";

type MediaAutoDownloadUser = {
    id?: string | null;
    imageMediaAutoDownload?: boolean;
    videoMediaAutoDownload?: boolean;
};

export function getMessageMediaAutoDownload(
    message: Pick<Message, "attached_media" | "sender_user_id">,
    user?: MediaAutoDownloadUser | null
) {
    return true;
}
