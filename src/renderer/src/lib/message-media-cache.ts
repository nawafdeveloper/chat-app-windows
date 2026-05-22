const DB_NAME = "yhla-message-media-cache";
const STORE_NAME = "media";
const DB_VERSION = 1;
const memoryCache = new Map<string, Blob>();

type CachedMediaRecord = {
    objectKey: string;
    blob: Blob;
    mimeType: string;
    updatedAt: number;
};

function openCacheDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, {
                    keyPath: "objectKey",
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

export async function getCachedMessageMedia(
    objectKey: string
): Promise<Blob | null> {
    if (!objectKey) {
        return null;
    }

    const memoryBlob = memoryCache.get(objectKey);
    if (memoryBlob) {
        return memoryBlob;
    }

    try {
        return await withStore("readonly", async (store) => {
            const request = store.get(objectKey);

            return new Promise<Blob | null>((resolve, reject) => {
                request.onsuccess = () => {
                    const result = request.result as CachedMediaRecord | undefined;
                    const blob = result?.blob ?? null;

                    if (blob) {
                        memoryCache.set(objectKey, blob);
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

export async function cacheMessageMedia(
    objectKey: string,
    blob: Blob
): Promise<void> {
    if (!objectKey) {
        return;
    }

    memoryCache.set(objectKey, blob);

    try {
        await withStore("readwrite", async (store) => {
            const request = store.put({
                objectKey,
                blob,
                mimeType: blob.type || "application/octet-stream",
                updatedAt: Date.now(),
            } satisfies CachedMediaRecord);

            await new Promise<void>((resolve, reject) => {
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        });
    } catch {
        // Memory cache still handles this session if IndexedDB is unavailable.
    }
}
