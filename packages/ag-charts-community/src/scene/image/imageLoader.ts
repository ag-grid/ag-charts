import { EventEmitter } from 'ag-charts-core';

type CacheEntry = { image: HTMLImageElement | undefined };

type EventMap = {
    'request-redraw': object;
};

export class ImageLoader extends EventEmitter<EventMap> {
    private readonly cache = new Map<string, CacheEntry>();

    public loadImage(uri: string): HTMLImageElement | undefined {
        const entry = this.cache.get(uri);
        if (entry != null) {
            return entry.image;
        }

        const nextEntry: CacheEntry = { image: undefined };
        const image = new Image();
        image.src = uri;
        image.onload = () => {
            nextEntry.image = image;
            this.emit('request-redraw', {});
        };
        this.cache.set(uri, nextEntry);
    }
}
