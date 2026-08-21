import { EventEmitter, getImage } from 'ag-charts-core';

type NotifiableNode = { markDirty: () => void };

type EventMap = {
    'image-loaded': { uri: string };
    'image-error': { uri: string };
};

type CacheEntry = {
    image: HTMLImageElement | undefined;
    nodes: Set<NotifiableNode>;
    blobUrl: string | undefined;
};

export interface ImageSizeHint {
    width: number;
    height: number;
}

export class ImageLoader extends EventEmitter<EventMap> {
    private readonly cache = new Map<string, CacheEntry>();
    private imageLoadingCount = 0;
    private destroyed = false;

    public loadImage(
        uri: string,
        affectedNode?: NotifiableNode,
        sizeHint?: ImageSizeHint
    ): HTMLImageElement | undefined {
        // SVGs with only a viewBox have no intrinsic dimensions, so they must be cached per requested
        // size with explicit width/height injected; sized and unsized callers key differently.
        const cacheKey = computeCacheKey(uri, sizeHint);
        const entry = this.cache.get(cacheKey);
        if (entry?.image) {
            return entry.image;
        } else if (entry != null && affectedNode) {
            entry.nodes.add(affectedNode);
            return;
        }

        if (!affectedNode) {
            return;
        }

        const nextEntry: CacheEntry = { image: undefined, nodes: new Set([affectedNode]), blobUrl: undefined };
        this.cache.set(cacheKey, nextEntry);
        this.imageLoadingCount++;

        const revokeBlob = () => {
            if (nextEntry.blobUrl != null) {
                URL.revokeObjectURL(nextEntry.blobUrl);
                nextEntry.blobUrl = undefined;
            }
        };

        const onSuccess = (image: HTMLImageElement) => {
            if (this.destroyed) {
                revokeBlob();
                return;
            }
            nextEntry.image = image;
            for (const node of nextEntry.nodes) {
                node.markDirty();
            }
            nextEntry.nodes.clear();
            this.imageLoadingCount--;
            revokeBlob();
            this.emit('image-loaded', { uri });
        };
        const onFail = () => {
            if (this.destroyed) {
                revokeBlob();
                return;
            }
            this.imageLoadingCount--;
            nextEntry.nodes.clear();
            revokeBlob();
            // Drop the failed entry so a later loadImage re-attempts rather than binding to a
            // permanently-undefined cache slot.
            this.cache.delete(cacheKey);
            this.emit('image-error', { uri });
        };

        this.resolveSource(uri, sizeHint)
            .then((resolved) => {
                if (this.destroyed) {
                    // Torn down mid-fetch: revoke the blob URL and abandon without touching
                    // imageLoadingCount or emitting.
                    if (resolved.blobUrl != null) URL.revokeObjectURL(resolved.blobUrl);
                    return;
                }
                if (resolved.blobUrl != null) {
                    nextEntry.blobUrl = resolved.blobUrl;
                }
                const ImageCtor = getImage();
                const image = new ImageCtor();
                image.onload = () => onSuccess(image);
                image.onerror = onFail;
                image.src = resolved.src;
            })
            .catch(onFail);

        // The image resolves asynchronously; affected nodes are notified via markDirty on load.
        return undefined;
    }

    public unregisterNode(node: NotifiableNode): void {
        // Drops a detached node from every pending-notification set so a never-resolving load cannot
        // pin it, and its subtree, alive for the chart's lifetime.
        for (const entry of this.cache.values()) {
            entry.nodes.delete(node);
        }
    }

    private async resolveSource(uri: string, sizeHint?: ImageSizeHint): Promise<{ src: string; blobUrl?: string }> {
        if (!sizeHint || typeof fetch !== 'function' || typeof Blob === 'undefined') return { src: uri };
        // Only sized SVGs need the resize-injection round trip; fetching anything else costs a round
        // trip and emits spurious CORS errors before the `<img>` fallback loads it anyway.
        const pathSaysSvg = uriPathnameEndsWith(uri, '.svg');
        const dataUriSaysSvg = uri.startsWith('data:image/svg');
        if (!pathSaysSvg && !dataUriSaysSvg) return { src: uri };
        try {
            const res = await fetch(uri, { mode: 'cors' });
            const contentType = res.headers.get('content-type') ?? '';
            const contentTypeKnown = contentType.startsWith('image/') || contentType.startsWith('application/');
            const contentTypeSaysSvg = contentType.includes('svg');
            // Server contradicts the URL extension (e.g. an .svg path served as image/png) —
            // trust the headers and skip the body read entirely.
            if (contentTypeKnown && !contentTypeSaysSvg) return { src: uri };

            const text = await res.text();
            if (!contentTypeSaysSvg && !looksLikeSvgMarkup(text)) return { src: uri };

            const sized = injectSvgSize(text, sizeHint.width, sizeHint.height);
            if (!sized) return { src: uri };
            const blob = new Blob([sized], { type: 'image/svg+xml' });
            const blobUrl = URL.createObjectURL(blob);
            return { src: blobUrl, blobUrl };
        } catch {
            return { src: uri };
        }
    }

    waitingToLoad(): boolean {
        return this.imageLoadingCount > 0;
    }

    destroy() {
        this.destroyed = true;
        for (const entry of this.cache.values()) {
            entry.nodes.clear();
            if (entry.blobUrl != null) {
                URL.revokeObjectURL(entry.blobUrl);
                entry.blobUrl = undefined;
            }
        }
        this.cache.clear();
    }
}

function computeCacheKey(uri: string, sizeHint?: ImageSizeHint): string {
    return sizeHint ? `${uri}@${sizeHint.width}x${sizeHint.height}` : uri;
}

function uriPathnameEndsWith(uri: string, suffix: string): boolean {
    const queryStart = uri.search(/[?#]/);
    const path = queryStart >= 0 ? uri.slice(0, queryStart) : uri;
    return path.toLowerCase().endsWith(suffix);
}

// Anchored at start-of-buffer (after optional BOM, XML prolog, DOCTYPE, whitespace) so an HTML
// response that happens to embed an inline <svg> icon does not trip the sniff.
const SVG_MARKUP_PREFIX =
    /^\uFEFF?\s{0,32}(?:<\?xml[^>]{0,256}\?>\s{0,32})?(?:<!DOCTYPE[^>]{0,256}>\s{0,32})?<svg[\s>]/i;
function looksLikeSvgMarkup(text: string): boolean {
    return SVG_MARKUP_PREFIX.test(text);
}

// Only finite positive absolute `width`/`height` values (`12`, `12px`, `12.5pt`, `1e2`) count;
// relative units are treated as missing, as drawImage cannot rasterise a percentage-sized SVG.
const ABSOLUTE_SIZE = /^\s{0,8}\+?(\d{1,6}(?:\.\d{1,6})?(?:e[+-]?\d{1,3})?)\s{0,8}(?:px|pt|cm|mm|in|pc|q)?\s{0,8}$/i;
function hasAbsoluteSize(root: Element, attr: 'width' | 'height'): boolean {
    const raw = root.getAttribute(attr);
    if (raw == null) return false;
    const match = ABSOLUTE_SIZE.exec(raw);
    if (!match) return false;
    return Number.parseFloat(match[1]) > 0;
}

function injectSvgSize(svgText: string, width: number, height: number): string | undefined {
    if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') return undefined;
    try {
        const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
        const root = doc.documentElement;
        if (root?.tagName.toLowerCase() !== 'svg') return undefined;
        const hasWidth = hasAbsoluteSize(root, 'width');
        const hasHeight = hasAbsoluteSize(root, 'height');
        if (hasWidth && hasHeight) return undefined;
        if (!hasWidth) root.setAttribute('width', String(width));
        if (!hasHeight) root.setAttribute('height', String(height));
        return new XMLSerializer().serializeToString(root);
    } catch {
        return undefined;
    }
}
