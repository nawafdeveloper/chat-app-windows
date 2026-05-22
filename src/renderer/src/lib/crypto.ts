export type EncryptedPayloadType = "text" | "json" | "image" | "video" | "audio" | "file";

export interface EncryptedPayload {
    encryptedKey: string;
    iv: string;
    ciphertext: string;
    type: EncryptedPayloadType;
    mimeType?: string;
    fileName?: string;
}

// Helper functions
function base64ToBytes(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
    const binaryString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    return btoa(binaryString);
}

function toBufferSource(data: Uint8Array): ArrayBuffer {
    const buffer = data.buffer;
    if (buffer instanceof ArrayBuffer) {
        return buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
    }
    // Handle SharedArrayBuffer case - copy to new ArrayBuffer
    const result = new ArrayBuffer(data.byteLength);
    new Uint8Array(result).set(new Uint8Array(buffer, data.byteOffset, data.byteLength));
    return result;
}

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
    return toBufferSource(data);
}

async function fileToBytes(file: File | Blob): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    return new Uint8Array(arrayBuffer);
}

export async function encryptBytes(
    data: Uint8Array,
    publicKey: CryptoKey,
    type: EncryptedPayloadType,
    extra?: { mimeType?: string; fileName?: string }
): Promise<EncryptedPayload> {
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        publicKey,
        toBufferSource(data)
    );

    const rawAesKey = await crypto.subtle.exportKey("raw", publicKey);
    const encryptedKey = await crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        publicKey,
        rawAesKey
    );

    return {
        encryptedKey: bytesToBase64(new Uint8Array(encryptedKey)),
        iv: bytesToBase64(iv),
        ciphertext: bytesToBase64(new Uint8Array(encryptedData)),
        type,
        ...(extra?.mimeType && { mimeType: extra.mimeType }),
        ...(extra?.fileName && { fileName: extra.fileName }),
    };
}

export async function encryptText(text: string, publicKey: CryptoKey): Promise<EncryptedPayload> {
    const bytes = new TextEncoder().encode(text);
    return encryptBytes(bytes, publicKey, "text");
}

export async function encryptJSON<T = unknown>(data: T, publicKey: CryptoKey): Promise<EncryptedPayload> {
    const json = JSON.stringify(data);
    const bytes = new TextEncoder().encode(json);
    return encryptBytes(bytes, publicKey, "json");
}

export async function encryptImage(file: File | Blob, publicKey: CryptoKey): Promise<EncryptedPayload> {
    const bytes = await fileToBytes(file);
    const mimeType = file.type || "image/png";
    const fileName = file instanceof File ? file.name : undefined;
    return encryptBytes(bytes, publicKey, "image", { mimeType, fileName });
}

export async function encryptVideo(file: File | Blob, publicKey: CryptoKey): Promise<EncryptedPayload> {
    const bytes = await fileToBytes(file);
    const mimeType = file.type || "video/mp4";
    const fileName = file instanceof File ? file.name : undefined;
    return encryptBytes(bytes, publicKey, "video", { mimeType, fileName });
}

export async function encryptAudio(file: File | Blob, publicKey: CryptoKey): Promise<EncryptedPayload> {
    const bytes = await fileToBytes(file);
    const mimeType = file.type || "audio/mpeg";
    const fileName = file instanceof File ? file.name : undefined;
    return encryptBytes(bytes, publicKey, "audio", { mimeType, fileName });
}

export async function encryptFile(file: File | Blob, publicKey: CryptoKey): Promise<EncryptedPayload> {
    const bytes = await fileToBytes(file);
    const mimeType = file.type || "application/octet-stream";
    const fileName = file instanceof File ? file.name : undefined;
    return encryptBytes(bytes, publicKey, "file", { mimeType, fileName });
}

export async function encrypt(
    input: string | object | File | Blob,
    publicKey: CryptoKey
): Promise<EncryptedPayload> {
    if (typeof input === "string") {
        return encryptText(input, publicKey);
    }

    if (input instanceof File || input instanceof Blob) {
        const mime = input.type ?? "";
        if (mime.startsWith("image/")) return encryptImage(input, publicKey);
        if (mime.startsWith("video/")) return encryptVideo(input, publicKey);
        if (mime.startsWith("audio/")) return encryptAudio(input, publicKey);
        return encryptFile(input, publicKey);
    }

    return encryptJSON(input, publicKey);
}

// Decryption functions
export async function decryptBytes(
    payload: EncryptedPayload,
    privateKey: CryptoKey
): Promise<Uint8Array> {
    const iv = base64ToBytes(payload.iv);
    const ciphertext = base64ToBytes(payload.ciphertext);
    const encryptedKey = base64ToBytes(payload.encryptedKey);

    const decryptedKey = await crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        toArrayBuffer(encryptedKey)
    );

    const aesKey = await crypto.subtle.importKey(
        "raw",
        decryptedKey,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
    );

    const decryptedData = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: toArrayBuffer(iv) },
        aesKey,
        toArrayBuffer(ciphertext)
    );

    return new Uint8Array(decryptedData);
}

export async function decryptText(
    payload: EncryptedPayload,
    privateKey: CryptoKey
): Promise<string> {
    const bytes = await decryptBytes(payload, privateKey);
    return new TextDecoder().decode(bytes);
}

export async function decryptJSON<T = unknown>(
    payload: EncryptedPayload,
    privateKey: CryptoKey
): Promise<T> {
    const text = await decryptText(payload, privateKey);
    return JSON.parse(text) as T;
}

export async function decryptBlob(
    payload: EncryptedPayload,
    privateKey: CryptoKey
): Promise<Blob> {
    const bytes = await decryptBytes(payload, privateKey);
    const mimeType = payload.mimeType || "application/octet-stream";
    // Convert to ArrayBuffer to avoid type issues
    const arrayBuffer = toArrayBuffer(bytes);
    return new Blob([arrayBuffer], { type: mimeType });
}

export async function decryptImage(
    payload: EncryptedPayload,
    privateKey: CryptoKey
): Promise<Blob> {
    return decryptBlob(payload, privateKey);
}

export async function decryptVideo(
    payload: EncryptedPayload,
    privateKey: CryptoKey
): Promise<Blob> {
    return decryptBlob(payload, privateKey);
}

export async function decryptAudio(
    payload: EncryptedPayload,
    privateKey: CryptoKey
): Promise<Blob> {
    return decryptBlob(payload, privateKey);
}

export async function decryptFile(
    payload: EncryptedPayload,
    privateKey: CryptoKey
): Promise<Blob> {
    return decryptBlob(payload, privateKey);
}

export async function decrypt(
    payload: EncryptedPayload,
    privateKey: CryptoKey
): Promise<string | object | Blob> {
    switch (payload.type) {
        case "text":
            return decryptText(payload, privateKey);
        case "json":
            return decryptJSON(payload, privateKey);
        case "image":
            return decryptImage(payload, privateKey);
        case "video":
            return decryptVideo(payload, privateKey);
        case "audio":
            return decryptAudio(payload, privateKey);
        case "file":
            return decryptFile(payload, privateKey);
        default:
            throw new Error(`Unknown payload type: ${payload.type}`);
    }
}
