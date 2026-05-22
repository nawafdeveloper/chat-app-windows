export const MESSAGE_MEDIA_API_PATH = "https://halabakk-web.nawaf-alhasosah.workers.dev//api/message-media";
export const MESSAGE_MEDIA_PREVIEW_API_PATH = "https://halabakk-web.nawaf-alhasosah.workers.dev//api/message-media-preview";

export async function buildMessageMediaObjectKey(
    userId: string
): Promise<string> {
    const timestamp = Date.now();
    const hashInput = `${userId}-${timestamp}-${crypto.randomUUID()}`;
    const hashBuffer = new TextEncoder().encode(hashInput);
    const hashArray = new Uint8Array(
        await crypto.subtle.digest("SHA-256", hashBuffer)
    );
    const hashHex = Array.from(hashArray, (byte) =>
        byte.toString(16).padStart(2, "0")
    ).join("");
    const shortHash = hashHex.substring(0, 16);

    return `m/${shortHash}/${timestamp}.enc`;
}

export async function buildMessageMediaPreviewObjectKey(
    userId: string
): Promise<string> {
    const timestamp = Date.now();
    const hashInput = `${userId}-${timestamp}-${crypto.randomUUID()}-preview`;
    const hashBuffer = new TextEncoder().encode(hashInput);
    const hashArray = new Uint8Array(
        await crypto.subtle.digest("SHA-256", hashBuffer)
    );
    const hashHex = Array.from(hashArray, (byte) =>
        byte.toString(16).padStart(2, "0")
    ).join("");
    const shortHash = hashHex.substring(0, 16);

    return `mp/${shortHash}/${timestamp}.jpg`;
}

export function buildMessageMediaUrl(objectKey: string): string {
    return `${MESSAGE_MEDIA_API_PATH}/${objectKey}`;
}

export function buildMessageMediaPreviewUrl(objectKey: string): string {
    return `${MESSAGE_MEDIA_PREVIEW_API_PATH}/${objectKey}`;
}

export function parseManagedMessageMediaUrl(mediaUrl?: string | null): {
    objectKey: string;
} | null {
    if (!mediaUrl) {
        return null;
    }

    try {
        const parsed = new URL(mediaUrl, "http://localhost");

        if (!parsed.pathname.startsWith(MESSAGE_MEDIA_API_PATH)) {
            return null;
        }

        const objectKey = decodeURIComponent(
            parsed.pathname.replace(`${MESSAGE_MEDIA_API_PATH}/`, "")
        );

        if (!objectKey) {
            return null;
        }

        return { objectKey };
    } catch {
        return null;
    }
}

export function parseManagedMessageMediaPreviewUrl(previewUrl?: string | null): {
    objectKey: string;
} | null {
    if (!previewUrl) {
        return null;
    }

    try {
        const parsed = new URL(previewUrl, "http://localhost");

        if (!parsed.pathname.startsWith(MESSAGE_MEDIA_PREVIEW_API_PATH)) {
            return null;
        }

        const objectKey = decodeURIComponent(
            parsed.pathname.replace(`${MESSAGE_MEDIA_PREVIEW_API_PATH}/`, "")
        );

        if (!objectKey) {
            return null;
        }

        return { objectKey };
    } catch {
        return null;
    }
}
