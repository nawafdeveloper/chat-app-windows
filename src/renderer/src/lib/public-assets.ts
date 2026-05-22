const ABSOLUTE_ASSET_URL = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;

export function publicAssetSrc(src: string) {
    if (!src || ABSOLUTE_ASSET_URL.test(src)) {
        return src;
    }

    return src.replace(/^\/+/, "");
}

export function publicAssetCssUrl(src: string) {
    const resolvedSrc = publicAssetSrc(src)
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');

    return `url("${resolvedSrc}")`;
}
