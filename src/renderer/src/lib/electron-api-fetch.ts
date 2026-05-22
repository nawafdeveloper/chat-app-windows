import { AUTH_BASE_URL } from "../../../shared/auth-ipc";

const NEON_COLD_BOOT_RETRY_DELAY_MS = 700;

async function sleep(ms: number) {
    await new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function serializeRequestBody(body: BodyInit | null | undefined): Promise<string | null> {
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

    throw new Error("Unsupported Electron API request body type.");
}

export const electronApiFetch: typeof fetch = async (input, init) => {
    if (typeof window === "undefined" || !window.electronAPI?.appFetch) {
        return fetch(input, init);
    }

    const request = input instanceof Request ? input : null;
    const requestUrl = request?.url ?? input.toString();
    const url = requestUrl.startsWith("http")
        ? requestUrl
        : new URL(requestUrl.replace(/^\//, ""), AUTH_BASE_URL).toString();
    const headers = new Headers(request?.headers);

    if (init?.headers) {
        new Headers(init.headers).forEach((value, key) => {
            headers.set(key, value);
        });
    }

    const response = await window.electronAPI.appFetch({
        url,
        init: {
            method: init?.method ?? request?.method,
            headers: Array.from(headers.entries()),
            body: await serializeRequestBody(init?.body ?? (request ? await request.clone().text() : null)),
            redirect: init?.redirect ?? request?.redirect,
        },
    });

    return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
    });
};

function shouldRetryNeonColdBoot(response: Response): boolean {
    return response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500;
}

export async function fetchWithNeonColdBootRetry(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let lastError: unknown = null;
    let lastResponse: Response | null = null;

    for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
            const response = await electronApiFetch(input, init);

            if (!shouldRetryNeonColdBoot(response) || attempt === 1) {
                return response;
            }

            lastResponse = response;
        } catch (error) {
            lastError = error;

            if (attempt === 1) {
                throw error;
            }
        }

        await sleep(NEON_COLD_BOOT_RETRY_DELAY_MS);
    }

    if (lastResponse) {
        return lastResponse;
    }

    throw lastError instanceof Error ? lastError : new Error("Request failed.");
}
