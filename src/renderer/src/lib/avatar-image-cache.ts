const DB_NAME = "yhla-avatar-image-cache";
const STORE_NAME = "avatars";
const DB_VERSION = 1;

type CachedAvatarRecord = {
    cacheKey: string;
    blob: Blob;
    mimeType: string;
    updatedAt: number;
};

const memoryCache = new Map<string, Blob>();

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

export async function getCachedAvatarImage(cacheKey: string): Promise<Blob | null> {
    if (!cacheKey) {
        return null;
    }

    const memoryBlob = memoryCache.get(cacheKey);
    if (memoryBlob) {
        return memoryBlob;
    }

    try {
        return await withStore("readonly", async (store) => {
            const request = store.get(cacheKey);

            return new Promise<Blob | null>((resolve, reject) => {
                request.onsuccess = () => {
                    const result = request.result as CachedAvatarRecord | undefined;
                    const blob = result?.blob ?? null;

                    if (blob) {
                        memoryCache.set(cacheKey, blob);
                    }

                    resolve(blob);
                };
                request.onerror = () => reject(request.error);
            });
        });
    } catch {
        return null;
    }
}

export async function cacheAvatarImage(
    cacheKey: string,
    blob: Blob
): Promise<void> {
    if (!cacheKey || blob.size === 0) {
        return;
    }

    memoryCache.set(cacheKey, blob);

    try {
        await withStore("readwrite", async (store) => {
            const request = store.put({
                cacheKey,
                blob,
                mimeType: blob.type || "application/octet-stream",
                updatedAt: Date.now(),
            } satisfies CachedAvatarRecord);

            await new Promise<void>((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        });
    } catch {
        // Memory cache still handles this session if IndexedDB is unavailable.
    }
}
