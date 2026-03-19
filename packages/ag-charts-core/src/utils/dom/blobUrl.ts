const cache = new Map<string, string>();

function canCreateObjectURLs(): boolean {
    return typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function' && typeof Blob !== 'undefined';
}

export function dataUriToObjectURL(dataUri: string): string {
    const existing = cache.get(dataUri);
    if (existing) return existing;

    if (!canCreateObjectURLs()) return dataUri;

    const commaIndex = dataUri.indexOf(',');
    if (commaIndex === -1) return dataUri;

    const header = dataUri.substring(0, commaIndex);
    const data = dataUri.substring(commaIndex + 1);

    const mimeMatch = header.match(/data:([^;]+)/);
    const mime = mimeMatch?.[1] ?? 'image/svg+xml';
    const isBase64 = header.includes('base64');

    let blob: Blob;
    if (isBase64) {
        const binary = atob(data);
        const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
        blob = new Blob([bytes], { type: mime });
    } else {
        blob = new Blob([decodeURIComponent(data)], { type: mime });
    }
    const url = URL.createObjectURL(blob);
    cache.set(dataUri, url);
    return url;
}

export function processCssDataUris(css: string): string {
    if (!canCreateObjectURLs()) return css;

    const regex = /url\(\s*['"]?(data:image\/svg\+xml[^)'"]*?)['"]?\s*\)/g;
    return css.replace(regex, (_match, dataUri: string) => {
        const blobUrl = dataUriToObjectURL(dataUri);
        return `url(${blobUrl})`;
    });
}
