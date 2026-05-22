export function getFileExtension(url: string): string {
    return url.split('?')[0].split('#')[0].split('.').pop() || '';
}

export async function getFileSize(url: string): Promise<number | null> {
    const res = await fetch(url, { method: 'HEAD' });
    const size = res.headers.get('content-length');
    return size ? Number(size) : null;
}

export function formatFileSize(sizeBytes?: number | null): string {
    if (!sizeBytes || !Number.isFinite(sizeBytes) || sizeBytes <= 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB", "GB"];
    let size = sizeBytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }

    const precision = unitIndex === 0 ? 0 : size >= 10 ? 1 : 2;
    return `${size.toFixed(precision)} ${units[unitIndex]}`;
}
