import type { OpenGraphData } from "../types/messages.type";

const MAX_OG_FIELD_LENGTH = 500;

function normalizeOpenGraphText(value: unknown): string | null {
    if (typeof value !== "string") {
        return null;
    }

    const trimmed = value.replace(/\s+/g, " ").trim();

    return trimmed ? trimmed.slice(0, MAX_OG_FIELD_LENGTH) : null;
}

function normalizeOpenGraphUrl(value: unknown): string | null {
    const text = normalizeOpenGraphText(value);

    if (!text) {
        return null;
    }

    try {
        const url = new URL(text);

        if (url.protocol !== "http:" && url.protocol !== "https:") {
            return null;
        }

        return url.toString();
    } catch {
        return null;
    }
}

export function normalizeOpenGraphData(
    value: OpenGraphData | null | undefined
): OpenGraphData | null {
    if (!value || typeof value !== "object") {
        return null;
    }

    const ogUrl = normalizeOpenGraphUrl(value.og_url);
    const ogTitle = normalizeOpenGraphText(value.og_title);
    const ogDescription = normalizeOpenGraphText(value.og_description);

    if (!ogUrl || (!ogTitle && !ogDescription)) {
        return null;
    }

    return {
        og_url: ogUrl,
        og_title: ogTitle,
        og_description: ogDescription,
    };
}
