import { EventEmitter } from 'ag-charts-core';

type NotifiableNode = { markDirty: () => void };

type EventMap = {
    'image-loaded': { uri: string };
    'image-error': { uri: string };
};

type CacheEntry = {
    image: HTMLImageElement | undefined;
    nodes: Set<NotifiableNode>;
};

export class ImageLoader extends EventEmitter<EventMap> {
    private readonly cache = new Map<string, CacheEntry>();
    private imageLoadingCount = 0;

    public loadImage(uri: string, node: NotifiableNode): HTMLImageElement | undefined {
        const entry = this.cache.get(uri);
        if (entry?.image) {
            return entry.image;
        } else if (entry != null) {
            entry.nodes.add(node);
            return;
        }

        const nextEntry: CacheEntry = { image: undefined, nodes: new Set([node]) };
        const image = new Image();
        this.imageLoadingCount++;
        image.onload = () => {
            nextEntry.image = image;
            nextEntry.nodes.forEach((n) => n.markDirty());
            nextEntry.nodes.clear();
            this.imageLoadingCount--;
            this.emit('image-loaded', { uri });
        };
        image.onerror = () => {
            this.imageLoadingCount--;
            nextEntry.nodes.clear();
            this.emit('image-error', { uri });
        };
        image.src = uri;
        this.cache.set(uri, nextEntry);

        return nextEntry.image;
    }

    waitingToLoad(): boolean {
        return this.imageLoadingCount > 0;
    }

    destroy() {
        this.cache.forEach((entry) => {
            entry.nodes.clear();
        });
        this.cache.clear();
    }
}
