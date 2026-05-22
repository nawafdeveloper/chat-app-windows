import type { DBFieldAttribute } from "better-auth/client"
import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields, phoneNumberClient } from "better-auth/client/plugins"
import { AUTH_BASE_URL } from "../../../shared/auth-ipc";

type UserAdditionalFields = Record<string, DBFieldAttribute>;

export const userAdditionalFields = {
    lastSeen: {
        type: "date",
        input: true,
        defaultValue: () => new Date(),
    },
    whoCanSeeLastSeen: {
        type: "string",
        input: true,
        defaultValue: "all",
    },
    whoCanSeeProfilePicture: {
        type: "string",
        input: true,
        defaultValue: "all",
    },
    whoCanSeeAbout: {
        type: "string",
        input: true,
        defaultValue: "all",
    },
    whoCanSeeStatus: {
        type: "string",
        input: true,
        defaultValue: "all",
    },
    enableReadReceipts: {
        type: "boolean",
        input: true,
        defaultValue: true,
    },
    defaultMessageTimer: {
        type: "string",
        input: true,
        defaultValue: "24h",
    },
    totalBlockedContact: {
        type: "number",
        input: true,
        defaultValue: 0,
    },
    enableAppLock: {
        type: "boolean",
        input: true,
        defaultValue: false,
    },
    blockUnknownAccount: {
        type: "boolean",
        input: true,
        defaultValue: false,
    },
    disableLinkPreview: {
        type: "boolean",
        input: true,
        defaultValue: false,
    },
    chatWallpaper: {
        type: "string",
        input: true,
        defaultValue: "wallpaper-1",
    },
    mediaUploadQuality: {
        type: "string",
        input: true,
        defaultValue: "std",
    },
    imageMediaAutoDownload: {
        type: "boolean",
        input: true,
        defaultValue: false,
    },
    videoMediaAutoDownload: {
        type: "boolean",
        input: true,
        defaultValue: false,
    },
    voiceMediaAutoDownload: {
        type: "boolean",
        input: true,
        defaultValue: false,
    },
    fileMediaAutoDownload: {
        type: "boolean",
        input: true,
        defaultValue: false,
    },
    disableMessagesNotifications: {
        type: "boolean",
        input: true,
        defaultValue: false,
    },
    disableGroupsNotifications: {
        type: "boolean",
        input: true,
        defaultValue: false,
    },
    yhlaPushToken: {
        type: "string",
        input: true,
        defaultValue: ""
    },
    yhlaPublicKey: {
        type: "string",
        input: true,
        defaultValue: ""
    },
    yhlaEncryptedPrivateKey: {
        type: "string",
        input: true,
        defaultValue: ""
    },
    yhlaPrivateKeyIv: {
        type: "string",
        input: true,
        defaultValue: ""
    },
    yhlaPinSalt: {
        type: "string",
        input: true,
        defaultValue: ""
    },
    yhlaPinVerificationTag: {
        type: "string",
        input: true,
        defaultValue: ""
    },
    yhlaPinVerificationIv: {
        type: "string",
        input: true,
        defaultValue: ""
    },
    isNewUser: {
        type: "boolean",
        input: true,
        defaultValue: true
    },
    aboutCiphertext: {
        type: 'string',
        input: true,
        defaultValue: ''
    },
    aboutEncryptedAesKey: {
        type: 'string',
        input: true,
        defaultValue: ''
    },
    aboutIv: {
        type: 'string',
        input: true,
        defaultValue: ''
    },
} satisfies UserAdditionalFields;

async function serializeAuthRequestBody(body: BodyInit | null | undefined): Promise<string | null> {
    if (!body) {
        return null;
    }

    if (typeof body === "string") {
        return body;
    }

    if (body instanceof URLSearchParams) {
        return body.toString();
    }

    if (body instanceof Blob) {
        return body.text();
    }

    if (body instanceof ArrayBuffer) {
        return new TextDecoder().decode(body);
    }

    if (ArrayBuffer.isView(body)) {
        return new TextDecoder().decode(body);
    }

    throw new Error("Unsupported auth request body type.");
}

const electronAuthFetch: typeof fetch = async (input, init) => {
    if (typeof window === "undefined" || !window.electronAPI?.authFetch) {
        return fetch(input, init);
    }

    const request = input instanceof Request ? input : null;
    const headers = new Headers(request?.headers);

    if (init?.headers) {
        new Headers(init.headers).forEach((value, key) => {
            headers.set(key, value);
        });
    }

    const response = await window.electronAPI.authFetch({
        url: request?.url ?? input.toString(),
        init: {
            method: init?.method ?? request?.method,
            headers: Array.from(headers.entries()),
            body: await serializeAuthRequestBody(init?.body ?? (request ? await request.clone().text() : null)),
            redirect: init?.redirect ?? request?.redirect,
        },
    });

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
    });
};

export const authClient = createAuthClient({
    baseURL: AUTH_BASE_URL,
    fetchOptions: {
        customFetchImpl: electronAuthFetch,
    },
    plugins: [
        phoneNumberClient(),
        inferAdditionalFields({
            user: {
                ...userAdditionalFields,
            },
        }),
    ]
})
