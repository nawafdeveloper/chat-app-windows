import { useEffect, useMemo, useState } from "react";
import { useCryptoKeys } from "../context/crypto";
import {
    cacheAvatarImage,
    getCachedAvatarImage,
} from "../lib/avatar-image-cache";
import { fetchAndDecryptMessageMedia } from "../lib/message-media-upload";
import { parseManagedMessageMediaUrl } from "../lib/message-media-url";
import { fetchAndDecryptProfileImage } from "../lib/profile-image-upload";
import { parseManagedProfileImageUrl } from "../lib/profile-image-url";
import { logMediaDebug } from "../lib/message-media-debug";

function isImmediateAvatarUrl(imageUrl: string) {
    return imageUrl.startsWith("blob:") || imageUrl.startsWith("data:");
}

function getAvatarUrlCacheKey(imageUrl: string) {
    if (typeof window === "undefined") {
        return `url:${imageUrl}`;
    }

    try {
        return `url:${new URL(imageUrl, window.location.origin).toString()}`;
    } catch {
        return `url:${imageUrl}`;
    }
}

export function useDecryptedProfileImage(imageUrl?: string | null) {
    const { isHydrated, isReady } = useCryptoKeys();
    const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const parsedManagedImage = useMemo(
        () => parseManagedProfileImageUrl(imageUrl),
        [imageUrl]
    );
    const parsedManagedMedia = useMemo(
        () => parseManagedMessageMediaUrl(imageUrl),
        [imageUrl]
    );

    useEffect(() => {
        let isActive = true;
        let objectUrl: string | null = null;
        const cleanup = () => {
            isActive = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
        const setBlobUrl = (blob: Blob) => {
            const nextObjectUrl = URL.createObjectURL(blob);

            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }

            objectUrl = nextObjectUrl;
            setDecryptedUrl(nextObjectUrl);
        };

        if (!imageUrl) {
            setDecryptedUrl(null);
            setLoading(false);
            setError(null);
            return;
        }

        if (isImmediateAvatarUrl(imageUrl)) {
            setDecryptedUrl(imageUrl);
            setLoading(false);
            setError(null);
            return;
        }

        if (!parsedManagedImage && !parsedManagedMedia) {
            const cacheKey = getAvatarUrlCacheKey(imageUrl);

            const loadPlainAvatar = async () => {
                try {
                    setLoading(false);
                    setError(null);

                    const cachedBlob = await getCachedAvatarImage(cacheKey);
                    if (!isActive) {
                        return;
                    }

                    if (cachedBlob) {
                        setBlobUrl(cachedBlob);
                        return;
                    }

                    setDecryptedUrl(imageUrl);

                    const response = await fetch(imageUrl, {
                        cache: "force-cache",
                        credentials: "same-origin",
                    });
                    if (!response.ok) {
                        return;
                    }

                    const blob = await response.blob();
                    if (!blob.type.startsWith("image/")) {
                        return;
                    }

                    await cacheAvatarImage(cacheKey, blob);
                    if (isActive) {
                        setBlobUrl(blob);
                    }
                } catch (err) {
                    if (!isActive) {
                        return;
                    }

                    setDecryptedUrl(imageUrl);
                    setError(
                        err instanceof Error
                            ? err
                            : new Error("Failed to cache avatar image")
                    );
                }
            };

            void loadPlainAvatar();
            return cleanup;
        }

        const managedObjectKey =
            parsedManagedImage?.objectKey ?? parsedManagedMedia?.objectKey ?? "";
        const managedCacheKey = parsedManagedImage
            ? `profile:${managedObjectKey}`
            : `media:${managedObjectKey}`;

        const loadManagedAvatar = async () => {
            const cachedBlob = await getCachedAvatarImage(managedCacheKey);
            if (!isActive) {
                return false;
            }

            if (!cachedBlob) {
                return false;
            }

            setBlobUrl(cachedBlob);
            setLoading(false);
            setError(null);
            logMediaDebug("client.profile-image.hook.cache-hit", {
                objectKey: managedObjectKey,
                mimeType: cachedBlob.type || null,
                size: cachedBlob.size,
            });
            return true;
        };

        if (!isHydrated) {
            void loadManagedAvatar().then((hasCachedAvatar) => {
                if (!isActive || hasCachedAvatar) {
                    return;
                }

                setDecryptedUrl(null);
                setLoading(true);
                setError(null);
            });
            return cleanup;
        }

        if (!isReady) {
            logMediaDebug("client.profile-image.hook.keys-locked", {
                objectKey: managedObjectKey,
            });
            setDecryptedUrl(null);
            setLoading(false);
            setError(new Error("Profile image decryption keys are locked."));
            return;
        }

        const fetchAndDecrypt = async () => {
            try {
                if (await loadManagedAvatar()) {
                    return;
                }

                setLoading(true);
                setError(null);
                logMediaDebug("client.profile-image.hook.load-start", {
                    objectKey: managedObjectKey,
                });

                const blob = parsedManagedImage
                    ? await fetchAndDecryptProfileImage(managedObjectKey)
                    : await fetchAndDecryptMessageMedia(managedObjectKey);
                if (!isActive) {
                    return;
                }

                await cacheAvatarImage(managedCacheKey, blob);
                if (!isActive) {
                    return;
                }

                setBlobUrl(blob);
                logMediaDebug("client.profile-image.hook.load-success", {
                    objectKey: managedObjectKey,
                    mimeType: blob.type || null,
                    size: blob.size,
                });
            } catch (err) {
                if (!isActive) {
                    return;
                }

                setError(err instanceof Error ? err : new Error("Failed to decrypt profile image"));
                logMediaDebug("client.profile-image.hook.load-failed", {
                    objectKey: managedObjectKey,
                    error:
                        err instanceof Error
                            ? err.message
                            : "Failed to decrypt profile image",
                });
                setDecryptedUrl(null);
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        void fetchAndDecrypt();

        return cleanup;
    }, [imageUrl, isHydrated, isReady, parsedManagedImage, parsedManagedMedia]);

    const directDisplayUrl =
        imageUrl &&
        ((!parsedManagedImage && !parsedManagedMedia) ||
            isImmediateAvatarUrl(imageUrl))
            ? imageUrl
            : null;

    return {
        decryptedUrl: decryptedUrl ?? directDisplayUrl,
        loading: directDisplayUrl ? false : loading,
        error,
    };
}
