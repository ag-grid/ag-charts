/**
 * Implements a most-recently-used caching strategy with a similar interface to Map.
 */
export class LRUCache<V, K = string> {
    private readonly store = new Map<K, V>();
    // The last key in the store's order, so a hit on it skips the refresh that would leave the order as it is.
    private newest: { key: K } | undefined;

    constructor(private readonly maxCacheSize: number) {
        if (maxCacheSize <= 0) {
            throw new Error('LRUCache size must be greater than 0');
        }
    }

    get(key: K) {
        // OPTIMIZATION: a run of hits on one key, as a measurer sees for one font, costs one lookup each.
        if (this.newest != null && this.newest.key === key) return this.store.get(key);
        if (!this.store.has(key)) return;

        // Refresh key.
        const value = this.store.get(key)!;
        this.store.delete(key);
        this.store.set(key, value);
        this.markNewest(key);

        return value;
    }

    has(key: K) {
        return this.store.has(key);
    }

    set(key: K, value: V) {
        // Map keeps an existing key where it was, so only a new key becomes the newest.
        if (!this.store.has(key)) this.markNewest(key);
        this.store.set(key, value);

        if (this.store.size > this.maxCacheSize) {
            const oldest = this.store.keys().next();
            if (!oldest.done) {
                this.store.delete(oldest.value);
            }
        }

        return value;
    }

    clear() {
        this.store.clear();
        this.newest = undefined;
    }

    private markNewest(key: K) {
        if (this.newest == null) {
            this.newest = { key };
        } else {
            this.newest.key = key;
        }
    }
}
