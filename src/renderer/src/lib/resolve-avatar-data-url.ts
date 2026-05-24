import {
    cacheAvatarImage,
    getCachedAvatarImage,
} from "./avatar-image-cache";
import { fetchAndDecryptMessageMedia } from "./message-media-upload";
import { fetchAndDecryptProfileImage } from "./profile-image-upload";
import { parseManagedMessageMediaUrl } from "./message-media-url";
import { parseManagedProfileImageUrl } from "./profile-image-url";

function getAvatarUrlCacheKey(imageUrl: string) {
    try {
        return `url:${new URL(imageUrl, window.location.origin).toString()}`;
    } catch {
        return `url:${imageUrl}`;
    }
}

export async function resolveAvatarDataUrl(
    imageUrl?: string | null
): Promise<string | null> {
    if (!imageUrl) return null;

    // Already a usable URL — convert blob to data URL, return data as-is
    if (imageUrl.startsWith("data:")) return imageUrl;
    if (imageUrl.startsWith("blob:")) {
        return blobUrlToDataUrl(imageUrl);
    }

    const parsedManagedImage = parseManagedProfileImageUrl(imageUrl);
    const parsedManagedMedia = parseManagedMessageMediaUrl(imageUrl);

    // Plain (unencrypted) avatar
    if (!parsedManagedImage && !parsedManagedMedia) {
        const cacheKey = getAvatarUrlCacheKey(imageUrl);
        const cached = await getCachedAvatarImage(cacheKey);
        if (cached) return blobToDataUrl(cached);

        try {
            const res = await fetch(imageUrl, { cache: "force-cache", credentials: "same-origin" });
            if (!res.ok) return null;
            const blob = await res.blob();
            if (!blob.type.startsWith("image/")) return null;
            await cacheAvatarImage(cacheKey, blob);
            return blobToDataUrl(blob);
        } catch {
            return null;
        }
    }

    // Encrypted managed avatar
    const objectKey =
        parsedManagedImage?.objectKey ?? parsedManagedMedia?.objectKey ?? "";
    const cacheKey = parsedManagedImage
        ? `profile:${objectKey}`
        : `media:${objectKey}`;

    const cached = await getCachedAvatarImage(cacheKey);
    if (cached) return blobToDataUrl(cached);

    try {
        const blob = parsedManagedImage
            ? await fetchAndDecryptProfileImage(objectKey)
            : await fetchAndDecryptMessageMedia(objectKey);
        await cacheAvatarImage(cacheKey, blob);
        return blobToDataUrl(blob);
    } catch {
        return null;
    }
}

function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
    });
}

async function blobUrlToDataUrl(blobUrl: string): Promise<string | null> {
    try {
        const res = await fetch(blobUrl);
        const blob = await res.blob();
        return blobToDataUrl(blob);
    } catch {
        return null;
    }
}