import { create } from "zustand";

export type PendingMediaAttachment = {
    id: string;
    chatId: string;
    file: File;
    mediaType: "photo" | "video";
    objectUrl: string;
};

type OpenMediaAttachmentInput = {
    chatId: string;
    file: File;
    mediaType: PendingMediaAttachment["mediaType"];
};

interface MediaAttachmentState {
    attachment: PendingMediaAttachment | null;
    openMediaAttachment: (input: OpenMediaAttachmentInput) => void;
    clearMediaAttachment: () => void;
}

function revokeObjectUrl(objectUrl?: string | null) {
    if (objectUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(objectUrl);
    }
}

export const useMediaAttachmentStore = create<MediaAttachmentState>((set) => ({
    attachment: null,
    openMediaAttachment: ({ chatId, file, mediaType }) =>
        set((state) => {
            revokeObjectUrl(state.attachment?.objectUrl);

            return {
                attachment: {
                    id: crypto.randomUUID(),
                    chatId,
                    file,
                    mediaType,
                    objectUrl: URL.createObjectURL(file),
                },
            };
        }),
    clearMediaAttachment: () =>
        set((state) => {
            revokeObjectUrl(state.attachment?.objectUrl);

            return { attachment: null };
        }),
}));
