import { useState, useCallback, useEffect } from "react";
import { generateKeyPair, exportPublicKey, encryptPrivateKey, decryptPrivateKey } from "../lib/crypto-keys";
import { generateSalt, derivePinKey, createPinVerificationTag, verifyPin, bufferToBase64, base64ToBuffer } from "../lib/crypto-pin";
import { uploadKeyBundle, fetchKeyBundle, updateKeyBundle } from "../lib/crypto-storage";
import { SessionKeys } from "../types/crypto";

export const SESSION_KEYS_STORAGE_KEY = "yhla_session_keys";

export type CryptoState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "unlocked"; session: SessionKeys }
    | { status: "error"; message: string };

// Helper functions to store/retrieve CryptoKey objects from localStorage
async function exportKeyToSpki(key: CryptoKey): Promise<string> {
    const spki = await crypto.subtle.exportKey("spki", key);
    return bufferToBase64(spki);
}

async function exportKeyToPkcs8(key: CryptoKey): Promise<string> {
    const pkcs8 = await crypto.subtle.exportKey("pkcs8", key);
    return bufferToBase64(pkcs8);
}

async function importPublicKeyFromSpki(spkiB64: string): Promise<CryptoKey> {
    const spki = base64ToBuffer(spkiB64);
    return await crypto.subtle.importKey(
        "spki",
        spki.buffer.slice(spki.byteOffset, spki.byteOffset + spki.byteLength) as ArrayBuffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"]
    );
}

async function importPrivateKeyFromPkcs8(pkcs8B64: string): Promise<CryptoKey> {
    const pkcs8 = base64ToBuffer(pkcs8B64);
    return await crypto.subtle.importKey(
        "pkcs8",
        pkcs8.buffer.slice(pkcs8.byteOffset, pkcs8.byteOffset + pkcs8.byteLength) as ArrayBuffer,
        { name: "RSA-OAEP", hash: "SHA-256" },
        false,
        ["decrypt"]
    );
}

async function storeSessionKeys(session: SessionKeys): Promise<void> {
    const publicKeySpki = await exportKeyToSpki(session.publicKey);
    const privateKeyPkcs8 = await exportKeyToPkcs8(session.privateKey);
    
    const storageData = {
        publicKey: publicKeySpki,
        privateKey: privateKeyPkcs8,
    };
    
    localStorage.setItem(SESSION_KEYS_STORAGE_KEY, JSON.stringify(storageData));
}

async function retrieveSessionKeys(): Promise<SessionKeys | null> {
    const stored = localStorage.getItem(SESSION_KEYS_STORAGE_KEY);
    if (!stored) return null;
    
    try {
        const data = JSON.parse(stored);
        const publicKey = await importPublicKeyFromSpki(data.publicKey);
        const privateKey = await importPrivateKeyFromPkcs8(data.privateKey);
        
        return { publicKey, privateKey };
    } catch {
        return null;
    }
}

function clearSessionKeys(): void {
    localStorage.removeItem(SESSION_KEYS_STORAGE_KEY);
}

export function useCryptoController() {
    const [state, setState] = useState<CryptoState>({ status: "idle" });
    const [isHydrated, setIsHydrated] = useState(false);

    // Load session keys from localStorage on mount
    useEffect(() => {
        const loadSessionKeys = async () => {
            const session = await retrieveSessionKeys();
            if (session) {
                setState({ status: "unlocked", session });
            }

            setIsHydrated(true);
        };

        void loadSessionKeys();
    }, []);

    const register = useCallback(async (pin: string) => {
        setState({ status: "loading" });
        try {
            const keyPair = await generateKeyPair();

            const salt = generateSalt();
            const pinKey = await derivePinKey(pin, salt);

            const { encryptedPrivateKey, iv: privateKeyIv } =
                await encryptPrivateKey(keyPair.privateKey, pinKey);

            const { tag: pinVerificationTag, iv: pinVerificationIv } =
                await createPinVerificationTag(pinKey);

            const publicKey = await exportPublicKey(keyPair.publicKey);

            await uploadKeyBundle({
                publicKey,
                encryptedPrivateKey,
                privateKeyIv,
                pinSalt: bufferToBase64(salt),
                pinVerificationTag,
                pinVerificationIv,
            });

            // Store unencrypted keys in localStorage for client-side use
            const session: SessionKeys = {
                privateKey: keyPair.privateKey,
                publicKey: keyPair.publicKey,
            };
            await storeSessionKeys(session);

            setState({
                status: "unlocked",
                session,
            });
        } catch (err) {
            setState({ status: "error", message: "Registration failed" });
            throw err;
        }
    }, []);

    const  unlock = useCallback(async (pin: string) => {
        setState({ status: "loading" });
        try {
            const bundle = await fetchKeyBundle();

            const pinCorrect = await verifyPin(
                pin,
                bundle.pinSalt,
                bundle.pinVerificationTag,
                bundle.pinVerificationIv
            );

            if (!pinCorrect) {
                setState({ status: "error", message: "Incorrect PIN" });
                return false;
            }

            const pinKey = await derivePinKey(
                pin,
                Uint8Array.from(atob(bundle.pinSalt), (c) => c.charCodeAt(0))
            );

            const privateKey = await decryptPrivateKey(
                bundle.encryptedPrivateKey,
                bundle.privateKeyIv,
                pinKey,
                true  // extractable: true so we can store it in localStorage
            );

            const { importPublicKey } = await import("../lib/crypto-keys");
            const publicKey = await importPublicKey(bundle.publicKey);

            // Store unencrypted keys in localStorage for client-side use
            const session: SessionKeys = { privateKey, publicKey };
            await storeSessionKeys(session);

            setState({
                status: "unlocked",
                session,
            });

            return true;
        } catch {
            setState({ status: "error", message: "Unlock failed" });
            return false;
        }
    }, []);

    const changePin = useCallback(
        async (currentPin: string, newPin: string) => {
            if (state.status !== "unlocked") throw new Error("Not unlocked");
            setState({ status: "loading" });

            try {
                const bundle = await fetchKeyBundle();
                const pinCorrect = await verifyPin(
                    currentPin,
                    bundle.pinSalt,
                    bundle.pinVerificationTag,
                    bundle.pinVerificationIv
                );

                if (!pinCorrect) {
                    setState({ status: "unlocked", session: state.session });
                    return false;
                }

                const newSalt = generateSalt();
                const newPinKey = await derivePinKey(newPin, newSalt);

                const { encryptedPrivateKey, iv: privateKeyIv } =
                    await encryptPrivateKey(state.session.privateKey, newPinKey);

                const { tag: pinVerificationTag, iv: pinVerificationIv } =
                    await createPinVerificationTag(newPinKey);

                await updateKeyBundle({
                    encryptedPrivateKey,
                    privateKeyIv,
                    pinSalt: bufferToBase64(newSalt),
                    pinVerificationTag,
                    pinVerificationIv,
                });

                setState({ status: "unlocked", session: state.session });
                return true;
            } catch {
                setState({ status: "error", message: "PIN change failed" });
                return false;
            }
        },
        [state]
    );

    const lock = useCallback(() => {
        clearSessionKeys();
        setState({ status: "idle" });
    }, []);

    return { state, isHydrated, register, unlock, changePin, lock };
}
