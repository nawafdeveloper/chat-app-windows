import { useEffect, useMemo, useState } from "react";
import { useCryptoKeys } from "../context/crypto";
import {
    buildAboutTextCacheKey,
    cacheAboutText,
    getCachedAboutText,
} from "../lib/about-text-cache";
import { decryptText } from "../lib/text-encryption";

type UseDecryptedAboutTextOptions = {
    ciphertext?: string | null;
    encryptedAesKey?: string | null;
    iv?: string | null;
    enabled?: boolean;
};

export function useDecryptedAboutText({
    ciphertext,
    encryptedAesKey,
    iv,
    enabled = true,
}: UseDecryptedAboutTextOptions) {
    const { isReady } = useCryptoKeys();
    const [aboutText, setAboutText] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const cacheKey = useMemo(() => {
        if (!ciphertext || !encryptedAesKey || !iv) {
            return null;
        }

        return buildAboutTextCacheKey({
            ciphertext,
            encryptedAesKey,
            iv,
        });
    }, [ciphertext, encryptedAesKey, iv]);

    useEffect(() => {
        let isActive = true;

        if (!enabled || !ciphertext || !encryptedAesKey || !iv || !cacheKey) {
            setAboutText(null);
            setLoading(false);
            setError(null);
            return;
        }

        const loadAbout = async () => {
            try {
                setError(null);

                const cachedText = await getCachedAboutText(cacheKey);
                if (!isActive) {
                    return;
                }

                if (cachedText !== null) {
                    setAboutText(cachedText);
                    setLoading(false);
                    return;
                }

                if (!isReady) {
                    setAboutText(null);
                    setLoading(false);
                    return;
                }

                setLoading(true);
                const decryptedText = await decryptText({
                    ciphertext,
                    encryptedAesKey,
                    iv,
                });
                if (!isActive) {
                    return;
                }

                await cacheAboutText(cacheKey, decryptedText);
                if (isActive) {
                    setAboutText(decryptedText);
                }
            } catch (err) {
                if (!isActive) {
                    return;
                }

                setAboutText(null);
                setError(
                    err instanceof Error
                        ? err
                        : new Error("Failed to decrypt about text")
                );
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        void loadAbout();

        return () => {
            isActive = false;
        };
    }, [cacheKey, ciphertext, encryptedAesKey, enabled, isReady, iv]);

    return {
        aboutText,
        loading,
        error,
    };
}
