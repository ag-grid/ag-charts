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
        // SVGs that declare only a viewBox have no intrinsic canvas dimensions, so canvas drawImage
        // rasterises them onto the default replaced-element size and ends up with content clipped
        // to a corner of the destination. Cache separately per requested size and inject explicit
        // width/height before loading.
        const cacheKey = sizeHint ? `${uri}@${sizeHint.width}x${sizeHint.height}` : uri;
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
            this.emit('image-error', { uri });
        };

        this.resolveSource(uri, sizeHint)
            .then((resolved) => {
                if (this.destroyed) {
                    // Loader was torn down while the fetch was in flight. Revoke the freshly-created
                    // blob URL (if any) and abandon the image; do not touch imageLoadingCount or emit.
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

        return nextEntry.image;
    }

    private async resolveSource(uri: string, sizeHint?: ImageSizeHint): Promise<{ src: string; blobUrl?: string }> {
        if (!sizeHint || typeof fetch !== 'function' || typeof Blob === 'undefined') return { src: uri };
        try {
            const res = await fetch(uri, { mode: 'cors' });
            const contentType = res.headers.get('content-type') ?? '';
            // Skip the body read entirely when the content-type or URL extension contradicts SVG.
            // A non-SVG `image/*` response should not pay the cost of UTF-8-decoding its binary body.
            const contentTypeKnown = contentType.startsWith('image/') || contentType.startsWith('application/');
            const contentTypeSaysSvg = contentType.includes('svg');
            const pathSaysSvg = uriPathnameEndsWith(uri, '.svg');
            if (contentTypeKnown && !contentTypeSaysSvg && !pathSaysSvg) return { src: uri };

            const text = await res.text();
            // Sniff only when content-type is empty/generic AND path didn't already say svg.
            if (!contentTypeSaysSvg && !pathSaysSvg && !looksLikeSvgMarkup(text)) return { src: uri };

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

function uriPathnameEndsWith(uri: string, suffix: string): boolean {
    const queryStart = uri.search(/[?#]/);
    const path = queryStart >= 0 ? uri.slice(0, queryStart) : uri;
    return path.toLowerCase().endsWith(suffix);
}

// Anchored at start-of-buffer (after optional BOM, XML prolog, DOCTYPE, whitespace) so an HTML
// response that happens to embed an inline <svg> icon does not trip the sniff.
const SVG_MARKUP_PREFIX = /^\uFEFF?\s{0,32}(?:<\?xml[^>]{0,256}\?>\s{0,32})?(?:<!DOCTYPE[^>]{0,256}>\s{0,32})?<svg[\s>]/i;
function looksLikeSvgMarkup(text: string): boolean {
    return SVG_MARKUP_PREFIX.test(text);
}

// A `width`/`height` attribute that parses as a finite positive absolute number (`12`, `12px`,
// `12.5pt`) is honoured; relative units (`100%`, `50vw`, `1em`) and zero/negative values are
// treated as missing — canvas drawImage cannot rasterise a percentage-sized SVG, which is the
// bug this function was created to fix.
const ABSOLUTE_SIZE = /^\s{0,8}\+?(\d{1,6}(?:\.\d{1,6})?)\s{0,8}(?:px|pt|cm|mm|in|pc|q)?\s{0,8}$/i;
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
