/**
 * Implements a most-recently-used caching strategy with a similar
 * interface to Map.
 */
export class LRUCache<K, V> {
    private readonly store = new Map<K, V>();

    constructor(private readonly maxCacheSize = 5) {}

    public get(key: K) {
        if (!this.store.has(key)) return undefined;

        // Refresh key.
        const hit = this.store.get(key);
        this.store.delete(key);
        this.store.set(key, hit!);

        return hit;
    }

    public has(key: K) {
        return this.store.has(key);
    }

    public set(key: K, value: V) {
        this.store.set(key, value);

        if (this.store.size > this.maxCacheSize) {
            const iterator = this.store.keys();
            let evictCount = this.store.size - this.maxCacheSize;
            while (evictCount > 0) {
                const evictKeyIterator = iterator.next();
                if (!evictKeyIterator.done) {
                    this.store.delete(evictKeyIterator.value);
                }

                evictCount--;
            }
        }

        return value;
    }

    public clear() {
        this.store.clear();
    }
}
