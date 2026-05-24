import { importPrivateKey, importPublicKey } from "./crypto-keys";
import { cacheMessageMedia, getCachedMessageMedia } from "./message-media-cache";
import {
    buildMediaDebugHeaders,
    logMediaDebug,
} from "./message-media-debug";
import { createMessageMediaPreview } from "./message-media-preview";
import { base64ToBuffer, bufferToBase64 } from "./crypto-pin";
import { decryptFileWithAes, encryptFileWithAes } from "./profile-image-encryption";
import { parseManagedMessageMediaUrl } from "./message-media-url";
import { electronApiFetch } from "./electron-api-fetch";
import type { RecipientEncryptedAesKeyInput } from "../types/crypto";

const SESSION_KEYS_STORAGE_KEY = "yhla_session_keys";

type StoredSessionKeys = {
    publicKey: string;
    privateKey: string;
};

export type MessageMediaRecipientPublicKeyInput = {
    recipientUserId: string;
    publicKey: string | CryptoKey;
};

export interface MessageMediaUploadResult {
    mediaUrl: string;
    previewUrl: string | null;
    sizeBytes: number;
    objectKey: string;
    recipientEncryptionKeys: RecipientEncryptedAesKeyInput[];
}

async function retrieveSessionKeys(): Promise<{
    publicKey: CryptoKey;
    privateKey: CryptoKey;
} | null> {
    const stored = localStorage.getItem(SESSION_KEYS_STORAGE_KEY);
    if (!stored) {
        return null;
    }

    try {
        const data = JSON.parse(stored) as StoredSessionKeys;
        const publicKey = await importPublicKey(data.publicKey);
        const privateKeyBytes = base64ToBuffer(data.privateKey);
        const privateKey = await importPrivateKey(
            privateKeyBytes.buffer.slice(
                privateKeyBytes.byteOffset,
                privateKeyBytes.byteOffset + privateKeyBytes.byteLength
            ) as ArrayBuffer,
            true
        );

        return { publicKey, privateKey };
    } catch {
        return null;
    }
}

async function encryptAesKeyWithPublicKey(
    aesKeyBase64: string,
    publicKey: CryptoKey
): Promise<string> {
    const aesKeyBytes = base64ToBuffer(aesKeyBase64);
    const encrypted = await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        aesKeyBytes.buffer.slice(
            aesKeyBytes.byteOffset,
            aesKeyBytes.byteOffset + aesKeyBytes.byteLength
        ) as ArrayBuffer
    );

    return bufferToBase64(encrypted);
}

async function decryptAesKeyWithPrivateKey(
    encryptedAesKeyBase64: string,
    privateKey: CryptoKey
): Promise<string> {
    const encryptedBytes = base64ToBuffer(encryptedAesKeyBase64);
    const decrypted = await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        encryptedBytes.buffer.slice(
            encryptedBytes.byteOffset,
            encryptedBytes.byteOffset + encryptedBytes.byteLength
        ) as ArrayBuffer
    );

    return bufferToBase64(decrypted);
}

function cloneUint8Array(data: Uint8Array): ArrayBuffer {
    const sourceBuffer = data.buffer.slice(
        data.byteOffset,
        data.byteOffset + data.byteLength
    );
    const arrayBuffer = new ArrayBuffer(sourceBuffer.byteLength);
    new Uint8Array(arrayBuffer).set(new Uint8Array(sourceBuffer));
    return arrayBuffer;
}

export async function uploadEncryptedMessageMedia(
    file: File,
    recipientPublicKeys: MessageMediaRecipientPublicKeyInput[],
    previewBlobOverride?: Blob | null,
    debugTraceId?: string
): Promise<MessageMediaUploadResult> {
    if (recipientPublicKeys.length === 0) {
        throw new Error("At least one recipient public key is required.");
    }

    logMediaDebug("client.upload.start", {
        debugTraceId: debugTraceId ?? null,
        fileName: file.name,
        fileType: file.type || null,
        fileSize: file.size,
        recipientCount: recipientPublicKeys.length,
        hasPreviewOverride: previewBlobOverride !== undefined,
    });

    const normalizedRecipientKeys = await Promise.all(
        recipientPublicKeys.map(async (recipient) => ({
            recipientUserId: recipient.recipientUserId,
            publicKey:
                typeof recipient.publicKey === "string"
                    ? await importPublicKey(recipient.publicKey)
                    : recipient.publicKey,
        }))
    );

    const { encryptedData, aesKey, iv } = await encryptFileWithAes(file);
    const recipientKeys = await Promise.all(
        normalizedRecipientKeys.map(async (recipient) => ({
            recipientUserId: recipient.recipientUserId,
            encryptedAesKey: await encryptAesKeyWithPublicKey(
                aesKey,
                recipient.publicKey
            ),
        }))
    );

    const encryptedFile = new File([cloneUint8Array(encryptedData)], file.name, {
        type: file.type,
    });
    const previewBlob =
        previewBlobOverride === undefined
            ? await createMessageMediaPreview(file)
            : previewBlobOverride;
    logMediaDebug("client.upload.prepared", {
        debugTraceId: debugTraceId ?? null,
        encryptedSize: encryptedFile.size,
        previewSize: previewBlob?.size ?? null,
        previewType: previewBlob?.type ?? null,
        recipientKeyCount: recipientKeys.length,
    });
    const formData = new FormData();
    formData.append("file", encryptedFile);
    formData.append("iv", iv);
    formData.append("recipientKeys", JSON.stringify(recipientKeys));
    formData.append("originalSizeBytes", String(file.size));

    if (previewBlob) {
        formData.append(
            "previewFile",
            new File([previewBlob], `${file.name}-preview.jpg`, {
                type: previewBlob.type || "image/jpeg",
            })
        );
    }

    const response = await fetch("https://halabakk-web.nawaf-alhasosah.workers.dev/api/message-media", {
        method: "POST",
        credentials: "include",
        headers: buildMediaDebugHeaders(debugTraceId),
        body: formData,
    });

    if (!response.ok) {
        const error = (await response.json()) as { error?: string };
        logMediaDebug("client.upload.failed", {
            debugTraceId: debugTraceId ?? null,
            status: response.status,
            error: error.error ?? "Failed to upload message media",
        });
        throw new Error(error.error || "Failed to upload message media");
    }

    const result = (await response.json()) as Omit<
        MessageMediaUploadResult,
        "recipientEncryptionKeys"
    >;
    logMediaDebug("client.upload.success", {
        debugTraceId: debugTraceId ?? null,
        objectKey: result.objectKey,
        mediaUrl: result.mediaUrl,
        previewUrl: result.previewUrl,
        sizeBytes: result.sizeBytes,
    });

    return {
        ...result,
        recipientEncryptionKeys: recipientKeys.map((key) => ({
            recipientUserId: key.recipientUserId,
            encryptedAesKey: key.encryptedAesKey,
            algorithm: "aes-256-gcm+rsa-oaep-sha256",
        })),
    };
}

export async function fetchAndDecryptMessageMedia(
    objectKeyOrUrl: string
): Promise<Blob> {
    logMediaDebug("client.decrypt.start", {
        objectKeyOrUrl,
    });
    const sessionKeys = await retrieveSessionKeys();
    if (!sessionKeys?.privateKey) {
        logMediaDebug("client.decrypt.no-private-key", {
            objectKeyOrUrl,
        });
        throw new Error("No private key found in session. Please unlock your keys again.");
    }

    const parsed =
        parseManagedMessageMediaUrl(objectKeyOrUrl) ??
        ({ objectKey: objectKeyOrUrl } as const);
    const cachedBlob = await getCachedMessageMedia(parsed.objectKey);

    if (cachedBlob) {
        logMediaDebug("client.decrypt.cache-hit", {
            objectKey: parsed.objectKey,
            mimeType: cachedBlob.type || null,
            size: cachedBlob.size,
        });
        return cachedBlob;
    }

    const keyResponse = await electronApiFetch(`/api/message-media/key/${parsed.objectKey}`);
    if (!keyResponse.ok) {
        logMediaDebug("client.decrypt.key-failed", {
            objectKey: parsed.objectKey,
            status: keyResponse.status,
        });
        throw new Error("Failed to fetch message media encryption key");
    }

    const keyData = (await keyResponse.json()) as {
        aesKey: string;
        iv: string;
        mimeType: string;
    };
    const aesKeyBase64 = await decryptAesKeyWithPrivateKey(
        keyData.aesKey,
        sessionKeys.privateKey
    );

    const mediaResponse = await fetch(`https://halabakk-web.nawaf-alhasosah.workers.dev/api/message-media/${parsed.objectKey}`, {
        credentials: "include",
    });
    if (!mediaResponse.ok) {
        logMediaDebug("client.decrypt.media-failed", {
            objectKey: parsed.objectKey,
            status: mediaResponse.status,
        });
        throw new Error("Failed to fetch encrypted message media");
    }

    const encryptedData = await mediaResponse.arrayBuffer();
    const decryptedData = await decryptFileWithAes(
        encryptedData,
        aesKeyBase64,
        keyData.iv
    );
    const blob = new Blob([cloneUint8Array(decryptedData)], {
        type: keyData.mimeType,
    });
    logMediaDebug("client.decrypt.success", {
        objectKey: parsed.objectKey,
        mimeType: keyData.mimeType,
        size: blob.size,
    });

    await cacheMessageMedia(parsed.objectKey, blob);

    return blob;
}

export async function persistDecryptedMessageMedia(
    objectKeyOrUrl: string,
    blob: Blob
) {
    const parsed =
        parseManagedMessageMediaUrl(objectKeyOrUrl) ??
        ({ objectKey: objectKeyOrUrl } as const);

    await cacheMessageMedia(parsed.objectKey, blob);
    logMediaDebug("client.decrypt.persisted-cache", {
        objectKey: parsed.objectKey,
        mimeType: blob.type || null,
        size: blob.size,
    });
}
