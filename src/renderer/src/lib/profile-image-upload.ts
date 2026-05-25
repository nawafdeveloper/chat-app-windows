import { importPublicKey } from "./crypto-keys";
import { base64ToBuffer, bufferToBase64 } from "./crypto-pin";
import { logMediaDebug } from "./message-media-debug";
import { decryptFileWithAes, encryptFileWithAes } from "./profile-image-encryption";
import { parseManagedProfileImageUrl } from "./profile-image-url";
import { getSessionCryptoKeys } from "./text-encryption";
import { electronApiFetch } from "./electron-api-fetch";

export interface ProfileImageUploadResult {
    imageUrl: string;
    mediaId: string;
}

export type ProfileImageRecipientPublicKeyInput = {
    recipientUserId: string;
    publicKey: string | CryptoKey;
};

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    return bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;
}

async function encryptAesKeyWithPublicKey(
    aesKeyBase64: string,
    publicKey: CryptoKey
): Promise<string> {
    const aesKeyBytes = base64ToBuffer(aesKeyBase64);
    const encrypted = await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        toArrayBuffer(aesKeyBytes)
    );

    return bufferToBase64(encrypted);
}

async function normalizeRecipientPublicKeys(
    recipients: ProfileImageRecipientPublicKeyInput[]
) {
    const uniqueRecipients = [
        ...new Map(
            recipients
                .filter((recipient) => recipient.recipientUserId && recipient.publicKey)
                .map((recipient) => [recipient.recipientUserId, recipient])
        ).values(),
    ];

    return Promise.all(
        uniqueRecipients.map(async (recipient) => ({
            recipientUserId: recipient.recipientUserId,
            publicKey:
                typeof recipient.publicKey === "string"
                    ? await importPublicKey(recipient.publicKey)
                    : recipient.publicKey,
        }))
    );
}

async function decryptAesKeyWithPrivateKey(
    encryptedAesKeyBase64: string,
    privateKey: CryptoKey
): Promise<string> {
    const encryptedBytes = base64ToBuffer(encryptedAesKeyBase64);
    const decrypted = await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        toArrayBuffer(encryptedBytes)
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

/**
 * Encrypt and upload a profile image.
 * The image is encrypted with a random AES-256-GCM key before uploading.
 * The AES key is sent to the server for authorized access.
 */
export async function uploadEncryptedProfileImage(
    file: File,
    recipientPublicKeys: ProfileImageRecipientPublicKeyInput[] = []
): Promise<ProfileImageUploadResult> {
    const sessionKeys = await getSessionCryptoKeys();
    if (!sessionKeys?.publicKey) {
        throw new Error("No public key found in session. Please unlock your keys again.");
    }

    const { encryptedData, aesKey, iv } = await encryptFileWithAes(file);
    const encryptedAesKey = await encryptAesKeyWithPublicKey(aesKey, sessionKeys.publicKey);
    const normalizedRecipientPublicKeys =
        await normalizeRecipientPublicKeys(recipientPublicKeys);
    const recipientKeys = await Promise.all(
        normalizedRecipientPublicKeys.map(async (recipient) => ({
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

    const formData = new FormData();
    formData.append("file", encryptedFile);
    formData.append("aesKey", encryptedAesKey);
    formData.append("iv", iv);
    formData.append("recipientKeys", JSON.stringify(recipientKeys));

    const response = await fetch("https://web.yahla.org/api/profile-image", {
        method: "POST",
        credentials: "include",
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json() as { error?: string };
        throw new Error(error.error || "Failed to upload profile image");
    }

    return response.json();
}

export async function shareEncryptedProfileImageWithRecipients(
    imageUrl: string | null | undefined,
    recipientPublicKeys: ProfileImageRecipientPublicKeyInput[]
): Promise<boolean> {
    const parsed = parseManagedProfileImageUrl(imageUrl);
    if (!parsed || recipientPublicKeys.length === 0) {
        return false;
    }

    const sessionKeys = await getSessionCryptoKeys();
    if (!sessionKeys?.privateKey) {
        throw new Error("No private key found in session. Please unlock your keys again.");
    }

    const keyResponse = await electronApiFetch(`/api/profile-image/key/${parsed.objectKey}`);
    if (!keyResponse.ok) {
        return false;
    }

    const keyData = await keyResponse.json() as { aesKey: string };
    const aesKeyBase64 = await decryptAesKeyWithPrivateKey(
        keyData.aesKey,
        sessionKeys.privateKey
    );
    const normalizedRecipientPublicKeys =
        await normalizeRecipientPublicKeys(recipientPublicKeys);
    const recipientKeys = await Promise.all(
        normalizedRecipientPublicKeys.map(async (recipient) => ({
            recipientUserId: recipient.recipientUserId,
            encryptedAesKey: await encryptAesKeyWithPublicKey(
                aesKeyBase64,
                recipient.publicKey
            ),
        }))
    );

    if (recipientKeys.length === 0) {
        return false;
    }

    const response = await electronApiFetch(`/api/profile-image/key/${parsed.objectKey}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ recipientKeys }),
    });

    return response.ok;
}

/**
 * Fetch and decrypt a profile image.
 * The client fetches the encrypted image and AES key separately.
 * Note: objectKey already includes the full path (e.g., p/d11921a8f40f4ec2/1776464818936.enc)
 */
export async function fetchAndDecryptProfileImage(objectKey: string): Promise<Blob> {
    logMediaDebug("client.profile-image.decrypt.start", {
        objectKey,
    });

    const sessionKeys = await getSessionCryptoKeys();
    if (!sessionKeys?.privateKey) {
        logMediaDebug("client.profile-image.decrypt.no-private-key", {
            objectKey,
        });
        throw new Error("No private key found in session. Please unlock your keys again.");
    }

    const keyResponse = await electronApiFetch(`/api/profile-image/key/${objectKey}`);
    if (!keyResponse.ok) {
        logMediaDebug("client.profile-image.decrypt.key-failed", {
            objectKey,
            status: keyResponse.status,
        });
        throw new Error("Failed to fetch encryption key");
    }

    const keyData = await keyResponse.json() as { aesKey: string; iv: string; mimeType: string };
    const { aesKey: encryptedAesKeyBase64, iv: ivBase64, mimeType } = keyData;
    let aesKeyBase64: string;

    try {
        aesKeyBase64 = await decryptAesKeyWithPrivateKey(
            encryptedAesKeyBase64,
            sessionKeys.privateKey
        );
        logMediaDebug("client.profile-image.decrypt.key-unwrapped", {
            objectKey,
            mimeType,
        });
    } catch (error) {
        logMediaDebug("client.profile-image.decrypt.key-unwrap-failed", {
            objectKey,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to decrypt profile image key",
        });
        throw new Error("Failed to decrypt profile image key.");
    }

    const imageResponse = await fetch(`https://web.yahla.org/api/profile-image/${objectKey}`, {
        credentials: "include",
    });
    if (!imageResponse.ok) {
        logMediaDebug("client.profile-image.decrypt.image-failed", {
            objectKey,
            status: imageResponse.status,
        });
        throw new Error("Failed to fetch encrypted image");
    }

    const encryptedData = await imageResponse.arrayBuffer();
    let decryptedData: Uint8Array;

    try {
        decryptedData = await decryptFileWithAes(
            encryptedData,
            aesKeyBase64,
            ivBase64
        );
    } catch (error) {
        logMediaDebug("client.profile-image.decrypt.aes-failed", {
            objectKey,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to decrypt profile image bytes",
        });
        throw new Error("Failed to decrypt profile image bytes.");
    }

    const blob = new Blob([cloneUint8Array(decryptedData)], { type: mimeType });
    logMediaDebug("client.profile-image.decrypt.success", {
        objectKey,
        mimeType: blob.type || null,
        size: blob.size,
    });

    return blob;
}
