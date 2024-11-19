import { Debug } from './debug';

const CLEANUP_TIMEOUT_MS = 100;

export class Pool<T, P> {
    private static readonly pools = new Map<string, Pool<any, any>>();

    static getPool<T, P>(
        name: string,
        buildItem: (p: P) => T,
        releaseItem: (i: T) => void,
        destroyItem: (i: T) => void,
        maxPoolSize: number
    ) {
        if (!this.pools.has(name)) {
            this.pools.set(name, new Pool<T, P>(name, buildItem, releaseItem, destroyItem, maxPoolSize));
        }
        return this.pools.get(name) as Pool<T, P>;
    }

    static readonly debug = Debug.create(true, 'pool');

    private readonly freePool: T[] = [];
    private readonly busyPool = new Set<T>();
    private cleanPoolTimer?: NodeJS.Timeout;

    public constructor(
        private readonly name: string,
        private readonly buildItem: (params: P) => T,
        private readonly releaseItem: (item: T) => void,
        private readonly destroyItem: (item: T) => void,
        private readonly maxPoolSize: number
    ) {}

    public isFull() {
        return this.freePool.length + this.busyPool.size >= this.maxPoolSize;
    }

    public obtain(params: P) {
        if (this.freePool.length === 0 && this.isFull()) {
            throw new Error('AG Charts - pool exhausted');
        }

        let nextFree = this.freePool.pop();
        if (nextFree == null) {
            nextFree = this.buildItem(params);
            Pool.debug(
                `Pool[name=${this.name}]: Created instance (${this.freePool.length} / ${this.busyPool.size + 1} / ${this.maxPoolSize})`,
                nextFree
            );
        } else {
            Pool.debug(
                `Pool[name=${this.name}]: Re-used instance (${this.freePool.length} / ${this.busyPool.size + 1} / ${this.maxPoolSize})`,
                nextFree
            );
        }

        this.busyPool.add(nextFree);
        return { item: nextFree, release: () => this.release(nextFree) };
    }

    public release(item: T) {
        if (!this.busyPool.has(item)) {
            throw new Error('AG Charts - cannot free item from pool which is not tracked as busy.');
        }

        Pool.debug(
            `Pool[name=${this.name}]: Releasing instance (${this.freePool.length} / ${this.busyPool.size} / ${this.maxPoolSize})`,
            item
        );

        this.releaseItem(item);
        this.busyPool.delete(item);
        this.freePool.push(item);

        Pool.debug(
            `Pool[name=${this.name}]: Returned instance to free pool (${this.freePool.length} / ${this.busyPool.size} / ${this.maxPoolSize})`,
            item
        );

        if (this.cleanPoolTimer) {
            clearTimeout(this.cleanPoolTimer);
        }
        this.cleanPoolTimer = setTimeout(() => {
            this.cleanPool();
        }, CLEANUP_TIMEOUT_MS);
    }

    private cleanPool() {
        const itemsToFree = this.freePool.splice(0);
        for (const item of itemsToFree) {
            this.destroyItem(item);
        }

        Pool.debug(
            `Pool[name=${this.name}]: Cleaned pool of ${itemsToFree.length} items (${this.freePool.length} / ${this.busyPool.size} / ${this.maxPoolSize})`
        );
    }

    destroy() {
        this.cleanPool();
        for (const item of this.busyPool.values()) {
            this.destroyItem(item);
        }
        this.busyPool.clear();
    }
}
