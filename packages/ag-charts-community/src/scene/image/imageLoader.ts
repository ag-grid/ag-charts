import { EventEmitter, getImage } from 'ag-charts-core';

type NotifiableNode = { markDirty: () => void };

type EventMap = {
    'image-loaded': { uri: string };
    'image-error': { uri: string };
};

type CacheEntry = {
    image: HTMLImageElement | undefined;
    nodes: Set<NotifiableNode>;
};

export interface ImageSizeHint {
    width: number;
    height: number;
}

export class ImageLoader extends EventEmitter<EventMap> {
    private readonly cache = new Map<string, CacheEntry>();
    private imageLoadingCount = 0;

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

        const nextEntry: CacheEntry = { image: undefined, nodes: new Set([affectedNode]) };
        this.cache.set(cacheKey, nextEntry);
        this.imageLoadingCount++;

        const onSuccess = (image: HTMLImageElement) => {
            nextEntry.image = image;
            for (const node of nextEntry.nodes) {
                node.markDirty();
            }
            nextEntry.nodes.clear();
            this.imageLoadingCount--;
            this.emit('image-loaded', { uri });
        };
        const onFail = () => {
            this.imageLoadingCount--;
            nextEntry.nodes.clear();
            this.emit('image-error', { uri });
        };

        this.resolveSource(uri, sizeHint)
            .then((src) => {
                const ImageCtor = getImage();
                const image = new ImageCtor();
                image.onload = () => onSuccess(image);
                image.onerror = onFail;
                image.src = src;
            })
            .catch(onFail);

        return nextEntry.image;
    }

    private async resolveSource(uri: string, sizeHint?: ImageSizeHint): Promise<string> {
        if (!sizeHint || typeof fetch !== 'function' || typeof Blob === 'undefined') return uri;
        try {
            const res = await fetch(uri, { mode: 'cors' });
            const contentType = res.headers.get('content-type') ?? '';
            if (!contentType.includes('svg') && !uri.toLowerCase().endsWith('.svg')) return uri;
            const text = await res.text();
            const sized = injectSvgSize(text, sizeHint.width, sizeHint.height);
            if (!sized) return uri;
            const blob = new Blob([sized], { type: 'image/svg+xml' });
            return URL.createObjectURL(blob);
        } catch {
            return uri;
        }
    }

    waitingToLoad(): boolean {
        return this.imageLoadingCount > 0;
    }

    destroy() {
        for (const entry of this.cache.values()) {
            entry.nodes.clear();
        }
        this.cache.clear();
    }
}

function injectSvgSize(svgText: string, width: number, height: number): string | undefined {
    if (typeof DOMParser === 'undefined' || typeof XMLSerializer === 'undefined') return undefined;
    try {
        const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
        const root = doc.documentElement;
        if (root?.tagName.toLowerCase() !== 'svg') return undefined;
        root.setAttribute('width', String(width));
        root.setAttribute('height', String(height));
        return new XMLSerializer().serializeToString(root);
    } catch {
        return undefined;
    }
}
