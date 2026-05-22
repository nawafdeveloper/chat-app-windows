export async function encryptFileWithAes(
    file: File | Blob
): Promise<{
    encryptedData: Uint8Array;
    aesKey: string;
    iv: string;
}> {
    // Generate a random AES-256-GCM key
    const aesKey = await crypto.subtle.generateKey(
        {
            name: "AES-GCM",
            length: 256,
        },
        true,
        ["encrypt", "decrypt"]
    );

    // Generate a random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Convert file to bytes
    const fileBytes = await file.arrayBuffer();
    const dataBytes = new Uint8Array(fileBytes);

    // Encrypt the data
    const encryptedData = await crypto.subtle.encrypt(
        {
            name: "AES-GCM",
            iv,
        },
        aesKey,
        dataBytes
    );

    // Export the AES key as raw bytes and encode as base64
    const rawKey = await crypto.subtle.exportKey("raw", aesKey);
    const aesKeyBase64 = btoa(
        String.fromCharCode(...new Uint8Array(rawKey))
    );

    // Encode the IV as base64
    const ivBase64 = btoa(String.fromCharCode(...iv));

    return {
        encryptedData: new Uint8Array(encryptedData),
        aesKey: aesKeyBase64,
        iv: ivBase64,
    };
}

/**
 * Decrypt data with AES-256-GCM using the provided key and IV.
 */
export async function decryptFileWithAes(
    encryptedData: Uint8Array | ArrayBuffer,
    aesKeyBase64: string,
    ivBase64: string
): Promise<Uint8Array> {
    // Decode the AES key and IV from base64
    const aesKeyBytes = Uint8Array.from(atob(aesKeyBase64), (c) => c.charCodeAt(0));
    const ivBytes = Uint8Array.from(atob(ivBase64), (c) => c.charCodeAt(0));

    // Import the AES key
    const aesKey = await crypto.subtle.importKey(
        "raw",
        aesKeyBytes,
        { name: "AES-GCM" },
        false,
        ["decrypt"]
    );

    // Convert encryptedData to proper BufferSource
    let dataBuffer: BufferSource;
    if (encryptedData instanceof Uint8Array) {
        // Handle Uint8Array case
        const sourceBuffer = encryptedData.buffer.slice(
            encryptedData.byteOffset,
            encryptedData.byteOffset + encryptedData.byteLength
        );
        // Copy to new ArrayBuffer to ensure it's not a SharedArrayBuffer
        const arrayBuffer = new ArrayBuffer(sourceBuffer.byteLength);
        new Uint8Array(arrayBuffer).set(new Uint8Array(sourceBuffer));
        dataBuffer = arrayBuffer;
    } else {
        // Already an ArrayBuffer
        dataBuffer = encryptedData;
    }

    // Decrypt the data
    const decryptedData = await crypto.subtle.decrypt(
        {
            name: "AES-GCM",
            iv: ivBytes,
        },
        aesKey,
        dataBuffer
    );

    return new Uint8Array(decryptedData);
}
