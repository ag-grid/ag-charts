/**
 * Implements a most-recently-used caching strategy with a similar interface to Map.
 */
export class LRUCache<V, K = string> {
    private readonly store = new Map<K, V>();

    constructor(private readonly maxCacheSize: number) {
        if (maxCacheSize <= 0) {
            throw new Error('LRUCache size must be greater than 0');
        }
    }

    get(key: K) {
        if (!this.store.has(key)) return;

        // Refresh key.
        const value = this.store.get(key)!;
        this.store.delete(key);
        this.store.set(key, value);

        return value;
    }

    has(key: K) {
        return this.store.has(key);
    }

    set(key: K, value: V) {
        this.store.set(key, value);

        if (this.store.size > this.maxCacheSize) {
            this.store.delete(this.store.keys().next().value);
        }

        return value;
    }

    clear() {
        this.store.clear();
    }
}
