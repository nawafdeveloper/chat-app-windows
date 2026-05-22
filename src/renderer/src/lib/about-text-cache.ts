const DB_NAME = "yhla-about-text-cache";
const STORE_NAME = "about";
const DB_VERSION = 1;

type CachedAboutTextRecord = {
    cacheKey: string;
    plaintext: string;
    updatedAt: number;
};

const memoryCache = new Map<string, string>();

function openCacheDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, {
                    keyPath: "cacheKey",
                });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function withStore<T>(
    mode: IDBTransactionMode,
    handler: (store: IDBObjectStore) => Promise<T>
): Promise<T> {
    const db = await openCacheDatabase();

    try {
        const transaction = db.transaction(STORE_NAME, mode);
        const store = transaction.objectStore(STORE_NAME);
        const result = await handler(store);

        await new Promise<void>((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
            transaction.onabort = () => reject(transaction.error);
        });

        return result;
    } finally {
        db.close();
    }
}

export function buildAboutTextCacheKey({
    ciphertext,
    encryptedAesKey,
    iv,
}: {
    ciphertext: string;
    encryptedAesKey: string;
    iv: string;
}) {
    return `${ciphertext}:${encryptedAesKey}:${iv}`;
}

export async function getCachedAboutText(
    cacheKey: string
): Promise<string | null> {
    if (!cacheKey) {
        return null;
    }

    const memoryValue = memoryCache.get(cacheKey);
    if (memoryValue !== undefined) {
        return memoryValue;
    }

    try {
        return await withStore("readonly", async (store) => {
            const request = store.get(cacheKey);

            return new Promise<string | null>((resolve, reject) => {
                request.onsuccess = () => {
                    const result =
                        request.result as CachedAboutTextRecord | undefined;
                    const plaintext = result?.plaintext ?? null;

                    if (plaintext !== null) {
                        memoryCache.set(cacheKey, plaintext);
                    }

                    resolve(plaintext);
                };
                request.onerror = () => reject(request.error);
            });
        });
    } catch {
        return null;
    }
}

export async function cacheAboutText(
    cacheKey: string,
    plaintext: string
): Promise<void> {
    if (!cacheKey) {
        return;
    }

    memoryCache.set(cacheKey, plaintext);

    try {
        await withStore("readwrite", async (store) => {
            const request = store.put({
                cacheKey,
                plaintext,
                updatedAt: Date.now(),
            } satisfies CachedAboutTextRecord);

            await new Promise<void>((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        });
    } catch {
        // Memory cache still handles this session if IndexedDB is unavailable.
    }
}
