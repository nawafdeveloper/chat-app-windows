import { importPrivateKey, importPublicKey } from "./crypto-keys";
import { base64ToBuffer, bufferToBase64 } from "./crypto-pin";

const SESSION_KEYS_STORAGE_KEY = "yhla_session_keys";

export const TEXT_ENCRYPTION_ALGORITHM = "aes-256-gcm+rsa-oaep-sha256";

export interface EncryptedTextPayload {
    ciphertext: string;
    encryptedAesKey: string;
    iv: string;
    algorithm: typeof TEXT_ENCRYPTION_ALGORITHM;
}

type StoredSessionKeys = {
    publicKey: string;
    privateKey: string;
};

type SessionCryptoKeys = {
    publicKey: CryptoKey;
    privateKey: CryptoKey;
};

type RecipientTextKeyMap = {
    version: 1;
    keys: Record<string, string>;
};

export type TextRecipientPublicKeyInput = {
    recipientUserId: string;
    publicKey: string | CryptoKey;
};

let sessionKeysCache:
    | {
          storedValue: string;
          keysPromise: Promise<SessionCryptoKeys | null>;
      }
    | null = null;

async function importStoredSessionKeys(
    stored: string
): Promise<SessionCryptoKeys | null> {
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

export async function getSessionCryptoKeys(): Promise<SessionCryptoKeys | null> {
    if (typeof window === "undefined") {
        return null;
    }

    const stored = localStorage.getItem(SESSION_KEYS_STORAGE_KEY);
    if (!stored) {
        sessionKeysCache = null;
        return null;
    }

    if (sessionKeysCache?.storedValue === stored) {
        return sessionKeysCache.keysPromise;
    }

    sessionKeysCache = {
        storedValue: stored,
        keysPromise: importStoredSessionKeys(stored),
    };

    return sessionKeysCache.keysPromise;
}

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

function parseRecipientTextKeyMap(
    storedValue: string
): RecipientTextKeyMap | null {
    if (!storedValue) {
        return null;
    }

    try {
        const parsed = JSON.parse(storedValue) as Partial<RecipientTextKeyMap>;
        if (
            parsed.version === 1 &&
            parsed.keys &&
            typeof parsed.keys === "object"
        ) {
            return {
                version: 1,
                keys: parsed.keys,
            };
        }
    } catch {
        return null;
    }

    return null;
}

function serializeRecipientTextKeys(keys: Record<string, string>): string {
    return JSON.stringify({
        version: 1,
        keys,
    } satisfies RecipientTextKeyMap);
}

async function normalizeRecipientPublicKeys(
    recipients: TextRecipientPublicKeyInput[]
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

async function decryptStoredAesKeyWithPrivateKey(
    encryptedAesKey: string,
    privateKey: CryptoKey
) {
    const keyMap = parseRecipientTextKeyMap(encryptedAesKey);
    const candidateKeys = keyMap ? Object.values(keyMap.keys) : [encryptedAesKey];
    let lastError: unknown = null;

    for (const candidateKey of candidateKeys) {
        try {
            return await decryptAesKeyWithPrivateKey(candidateKey, privateKey);
        } catch (error) {
            lastError = error;
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new Error("Failed to decrypt text key.");
}

export async function encryptTextWithPublicKey(
    plaintext: string,
    publicKey: CryptoKey
): Promise<EncryptedTextPayload> {
    const aesKey = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintextBytes = new TextEncoder().encode(plaintext);

    const encryptedText = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        aesKey,
        toArrayBuffer(plaintextBytes)
    );

    const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);
    const aesKeyBase64 = bufferToBase64(rawAesKey);
    const encryptedAesKey = await encryptAesKeyWithPublicKey(aesKeyBase64, publicKey);

    return {
        ciphertext: bufferToBase64(encryptedText),
        encryptedAesKey,
        iv: bufferToBase64(iv),
        algorithm: TEXT_ENCRYPTION_ALGORITHM,
    };
}

export async function decryptTextWithPrivateKey(
    payload: Pick<EncryptedTextPayload, "ciphertext" | "encryptedAesKey" | "iv">,
    privateKey: CryptoKey
): Promise<string> {
    const aesKeyBase64 = await decryptAesKeyWithPrivateKey(
        payload.encryptedAesKey,
        privateKey
    );
    const aesKeyBytes = base64ToBuffer(aesKeyBase64);
    const ciphertextBytes = base64ToBuffer(payload.ciphertext);
    const ivBytes = base64ToBuffer(payload.iv);

    const aesKey = await crypto.subtle.importKey(
        "raw",
        toArrayBuffer(aesKeyBytes),
        { name: "AES-GCM" },
        false,
        ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: toArrayBuffer(ivBytes),
        },
        aesKey,
        toArrayBuffer(ciphertextBytes)
    );

    return new TextDecoder().decode(decrypted);
}

export async function encryptText(plaintext: string): Promise<EncryptedTextPayload> {
    const sessionKeys = await getSessionCryptoKeys();
    if (!sessionKeys?.publicKey) {
        throw new Error("No public key found in session. Please unlock your keys again.");
    }

    return encryptTextWithPublicKey(plaintext, sessionKeys.publicKey);
}

export async function encryptTextForRecipients(
    plaintext: string,
    ownerUserId: string,
    recipients: TextRecipientPublicKeyInput[] = []
): Promise<EncryptedTextPayload> {
    const sessionKeys = await getSessionCryptoKeys();
    if (!sessionKeys?.publicKey) {
        throw new Error("No public key found in session. Please unlock your keys again.");
    }

    const aesKey = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 },
        true,
        ["encrypt", "decrypt"]
    );
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const plaintextBytes = new TextEncoder().encode(plaintext);
    const encryptedText = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        aesKey,
        toArrayBuffer(plaintextBytes)
    );
    const rawAesKey = await crypto.subtle.exportKey("raw", aesKey);
    const aesKeyBase64 = bufferToBase64(rawAesKey);
    const ownerEncryptedAesKey = await encryptAesKeyWithPublicKey(
        aesKeyBase64,
        sessionKeys.publicKey
    );
    const normalizedRecipients = await normalizeRecipientPublicKeys(recipients);
    const recipientKeys = await Promise.all(
        normalizedRecipients
            .filter((recipient) => recipient.recipientUserId !== ownerUserId)
            .map(async (recipient) => ({
                recipientUserId: recipient.recipientUserId,
                encryptedAesKey: await encryptAesKeyWithPublicKey(
                    aesKeyBase64,
                    recipient.publicKey
                ),
            }))
    );
    const keyMap = Object.fromEntries(
        recipientKeys.map((recipient) => [
            recipient.recipientUserId,
            recipient.encryptedAesKey,
        ])
    );
    keyMap[ownerUserId] = ownerEncryptedAesKey;

    return {
        ciphertext: bufferToBase64(encryptedText),
        encryptedAesKey: serializeRecipientTextKeys(keyMap),
        iv: bufferToBase64(iv),
        algorithm: TEXT_ENCRYPTION_ALGORITHM,
    };
}

export async function shareEncryptedTextWithRecipients({
    ownerUserId,
    encryptedAesKey,
    recipients,
}: {
    ownerUserId: string;
    encryptedAesKey: string;
    recipients: TextRecipientPublicKeyInput[];
}): Promise<string | null> {
    const sessionKeys = await getSessionCryptoKeys();
    if (!sessionKeys?.privateKey) {
        throw new Error("No private key found in session. Please unlock your keys again.");
    }

    const parsedKeyMap = parseRecipientTextKeyMap(encryptedAesKey);
    if (
        parsedKeyMap?.keys[ownerUserId] &&
        recipients.every(
            (recipient) =>
                recipient.recipientUserId === ownerUserId ||
                Boolean(parsedKeyMap.keys[recipient.recipientUserId])
        )
    ) {
        return null;
    }

    const aesKeyBase64 = await decryptStoredAesKeyWithPrivateKey(
        encryptedAesKey,
        sessionKeys.privateKey
    );
    const existingKeyMap = parsedKeyMap?.keys ?? {
        [ownerUserId]: encryptedAesKey,
    };
    const normalizedRecipients = await normalizeRecipientPublicKeys(recipients);
    const nextRecipientKeys = await Promise.all(
        normalizedRecipients
            .filter((recipient) => recipient.recipientUserId !== ownerUserId)
            .filter(
                (recipient) => !existingKeyMap[recipient.recipientUserId]
            )
            .map(async (recipient) => ({
                recipientUserId: recipient.recipientUserId,
                encryptedAesKey: await encryptAesKeyWithPublicKey(
                    aesKeyBase64,
                    recipient.publicKey
                ),
            }))
    );

    if (nextRecipientKeys.length === 0 && parsedKeyMap) {
        return null;
    }

    const mergedKeyMap = {
        ...existingKeyMap,
        ...Object.fromEntries(
            nextRecipientKeys.map((recipient) => [
                recipient.recipientUserId,
                recipient.encryptedAesKey,
            ])
        ),
    };

    return serializeRecipientTextKeys(mergedKeyMap);
}

export async function decryptText(
    payload: Pick<EncryptedTextPayload, "ciphertext" | "encryptedAesKey" | "iv">
): Promise<string> {
    const sessionKeys = await getSessionCryptoKeys();
    if (!sessionKeys?.privateKey) {
        throw new Error("No private key found in session. Please unlock your keys again.");
    }

    const aesKeyBase64 = await decryptStoredAesKeyWithPrivateKey(
        payload.encryptedAesKey,
        sessionKeys.privateKey
    );
    const aesKeyBytes = base64ToBuffer(aesKeyBase64);
    const ciphertextBytes = base64ToBuffer(payload.ciphertext);
    const ivBytes = base64ToBuffer(payload.iv);

    const aesKey = await crypto.subtle.importKey(
        "raw",
        toArrayBuffer(aesKeyBytes),
        { name: "AES-GCM" },
        false,
        ["decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: toArrayBuffer(ivBytes),
        },
        aesKey,
        toArrayBuffer(ciphertextBytes)
    );

    return new TextDecoder().decode(decrypted);
}
