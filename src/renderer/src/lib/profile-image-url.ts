export const PROFILE_IMAGE_API_PATH = "https://web.yahla.org/api/profile-image";
const PROFILE_IMAGE_API_PATHNAME = new URL(PROFILE_IMAGE_API_PATH).pathname;

// ---------------------------------------------------------------------------
// URL construction
// ---------------------------------------------------------------------------

/**
 * Generate a hashed object key using user ID and timestamp.
 * Format: `p/<hashed_id>/<timestamp>.enc`
 */
export async function buildProfileImageObjectKey(userId: string): Promise<string> {
    const timestamp = Date.now();
    const hashInput = `${userId}-${timestamp}-${crypto.randomUUID()}`;
    const hashBuffer = new TextEncoder().encode(hashInput);
    const hashArray = new Uint8Array(await crypto.subtle.digest("SHA-256", hashBuffer));
    const hashHex = Array.from(hashArray, (b) => b.toString(16).padStart(2, "0")).join("");
    const shortHash = hashHex.substring(0, 16);
    return `p/${shortHash}/${timestamp}.enc`;
}

/**
 * Build the profile image URL.
 * Format: `https://web.yahla.org/api/profile-image/<objectKey>`
 */
export function buildProfileImageUrl(objectKey: string): string {
    return `${PROFILE_IMAGE_API_PATH}/${objectKey}`;
}

// ---------------------------------------------------------------------------
// URL parsing
// ---------------------------------------------------------------------------

/**
 * Parse a managed profile image URL and extract the objectKey.
 * Returns `null` if the URL is not a managed profile image URL.
 */
export function parseManagedProfileImageUrl(imageUrl?: string | null): {
    objectKey: string;
} | null {
    if (!imageUrl) {
        return null;
    }

    try {
        const parsed = new URL(imageUrl, "http://localhost");

        if (!parsed.pathname.startsWith(PROFILE_IMAGE_API_PATHNAME)) {
            return null;
        }

        const objectKey = decodeURIComponent(
            parsed.pathname.replace(`${PROFILE_IMAGE_API_PATHNAME}/`, "")
        );

        if (!objectKey) {
            return null;
        }

        return {
            objectKey,
        };
    } catch {
        return null;
    }
}

export function isManagedProfileImageUrl(imageUrl?: string | null): boolean {
    return parseManagedProfileImageUrl(imageUrl) !== null;
}
