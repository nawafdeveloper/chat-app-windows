import { useEffect, useMemo, useState } from "react";
import { fetchAndDecryptMessageMedia } from "../lib/message-media-upload";
import { getCachedMessageMedia } from "../lib/message-media-cache";
import { logMediaDebug } from "../lib/message-media-debug";
import { parseManagedMessageMediaUrl } from "../lib/message-media-url";

type Options = {
    mediaUrl?: string | null;
    previewUrl?: string | null;
    autoDownload?: boolean;
};

export function useDecryptedMessageMedia({
    mediaUrl,
    previewUrl = null,
    autoDownload = true,
}: Options) {
    const [decryptedUrl, setDecryptedUrl] = useState<string | null>(null);
    const [mimeType, setMimeType] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const [isDownloaded, setIsDownloaded] = useState(false);

    const parsedManagedMedia = useMemo(
        () => parseManagedMessageMediaUrl(mediaUrl),
        [mediaUrl]
    );

    useEffect(() => {
        let isActive = true;
        let objectUrl: string | null = null;

        if (!mediaUrl) {
            logMediaDebug("client.media-hook.no-media-url", {
                previewUrl,
                autoDownload,
            });
            setDecryptedUrl(null);
            setMimeType(null);
            setLoading(false);
            setError(null);
            setIsDownloaded(false);
            return;
        }

        if (!parsedManagedMedia) {
            logMediaDebug("client.media-hook.non-managed-url", {
                mediaUrl,
                previewUrl,
            });
            setDecryptedUrl(mediaUrl);
            setMimeType(null);
            setLoading(false);
            setError(null);
            setIsDownloaded(true);
            return;
        }

        const loadMedia = async () => {
            try {
                setError(null);
                logMediaDebug("client.media-hook.load-start", {
                    objectKey: parsedManagedMedia.objectKey,
                    previewUrl,
                    autoDownload,
                });
                const cachedBlob = await getCachedMessageMedia(parsedManagedMedia.objectKey);

                if (cachedBlob) {
                    if (!isActive) {
                        return;
                    }

                    objectUrl = URL.createObjectURL(cachedBlob);
                    logMediaDebug("client.media-hook.cache-hit", {
                        objectKey: parsedManagedMedia.objectKey,
                        mimeType: cachedBlob.type || null,
                        size: cachedBlob.size,
                    });
                    setMimeType(cachedBlob.type || null);
                    setDecryptedUrl(objectUrl);
                    setIsDownloaded(true);
                    setLoading(false);
                    return;
                }

                setDecryptedUrl(null);
                setIsDownloaded(false);

                if (!autoDownload) {
                    logMediaDebug("client.media-hook.waiting-manual-download", {
                        objectKey: parsedManagedMedia.objectKey,
                        previewUrl,
                    });
                    setLoading(false);
                    return;
                }

                setLoading(true);
                const blob = await fetchAndDecryptMessageMedia(parsedManagedMedia.objectKey);
                if (!isActive) {
                    return;
                }

                objectUrl = URL.createObjectURL(blob);
                logMediaDebug("client.media-hook.decrypt-success", {
                    objectKey: parsedManagedMedia.objectKey,
                    mimeType: blob.type || null,
                    size: blob.size,
                });
                setMimeType(blob.type || null);
                setDecryptedUrl(objectUrl);
                setIsDownloaded(true);
            } catch (err) {
                if (!isActive) {
                    return;
                }

                setError(
                    err instanceof Error
                        ? err
                        : new Error("Failed to decrypt message media")
                );
                logMediaDebug("client.media-hook.decrypt-failed", {
                    objectKey: parsedManagedMedia.objectKey,
                    error:
                        err instanceof Error
                            ? err.message
                            : "Failed to decrypt message media",
                    previewUrl,
                });
                setMimeType(null);
                setDecryptedUrl(null);
                setIsDownloaded(false);
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        void loadMedia();

        return () => {
            isActive = false;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [autoDownload, mediaUrl, parsedManagedMedia]);

    const download = async () => {
        if (!parsedManagedMedia) {
            return;
        }

        try {
            setLoading(true);
            setError(null);
            logMediaDebug("client.media-hook.manual-download", {
                objectKey: parsedManagedMedia.objectKey,
            });

            const blob = await fetchAndDecryptMessageMedia(parsedManagedMedia.objectKey);
            const objectUrl = URL.createObjectURL(blob);

            setMimeType(blob.type || null);
            setDecryptedUrl((currentUrl) => {
                if (currentUrl?.startsWith("blob:")) {
                    URL.revokeObjectURL(currentUrl);
                }
                return objectUrl;
            });
            setIsDownloaded(true);
            logMediaDebug("client.media-hook.manual-download-success", {
                objectKey: parsedManagedMedia.objectKey,
                mimeType: blob.type || null,
                size: blob.size,
            });
        } catch (err) {
            setError(
                err instanceof Error
                    ? err
                    : new Error("Failed to decrypt message media")
            );
            logMediaDebug("client.media-hook.manual-download-failed", {
                objectKey: parsedManagedMedia.objectKey,
                error:
                    err instanceof Error
                        ? err.message
                        : "Failed to decrypt message media",
            });
        } finally {
            setLoading(false);
        }
    };

    return {
        decryptedUrl,
        displayUrl: decryptedUrl ?? previewUrl ?? null,
        previewUrl,
        mimeType,
        loading,
        error,
        isDownloaded,
        download,
    };
}
