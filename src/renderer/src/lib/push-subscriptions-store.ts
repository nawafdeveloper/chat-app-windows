type StoredPushSubscription = PushSubscriptionJSON & {
    endpoint: string;
}

declare global {
    var __yaahalaaPushSubscriptions:
        | StoredPushSubscription[]
        | undefined
}

function getStore() {
    // Temporary storage for local/dev and early production wiring.
    // Replace this with your real DB repository later.
    if (!globalThis.__yaahalaaPushSubscriptions) {
        globalThis.__yaahalaaPushSubscriptions = []
    }

    return globalThis.__yaahalaaPushSubscriptions
}

export function listSubscriptions() {
    return getStore()
}

export function saveSubscription(sub: StoredPushSubscription) {
    const store = getStore()
    const exists = store.some((entry) => entry.endpoint === sub.endpoint)

    if (!exists) {
        store.push(sub)
    }

    return store
}

export function removeSubscription(endpoint: string) {
    const nextStore = getStore().filter((entry) => entry.endpoint !== endpoint)
    globalThis.__yaahalaaPushSubscriptions = nextStore
    return nextStore
}
