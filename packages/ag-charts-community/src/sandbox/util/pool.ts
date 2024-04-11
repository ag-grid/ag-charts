/** Unique key to identify pooled instances */
const pooledKey = Symbol('pooledObject');

/** Defines a type that includes pooling capabilities for any object. */
type Pooled<T> = T & { [pooledKey]: Pool<T>; constructor: PoolConstructor<T> };

/** Constructor signature for objects that can be managed by a Pool. */
interface PoolConstructor<T> {
    className?: string;
    name: string;
    new (): T;
}

/** Manages a pool of object instances to optimize resource allocation. */
export class Pool<T> {
    /** Default number of objects to add to the pool when expanding. */
    static GrowthFactor = 64;

    /** Map of all active pools by class name. */
    private static pools = new Map<string, Pool<any>>();

    /**
     * Acquires an instance of the specified class from its corresponding pool.
     * @param classType The constructor of the class to acquire an instance of.
     * @returns An instance of the requested class.
     */
    static acquire<T>(classType: PoolConstructor<T>): T {
        const pool = this.pools.get(classType.className ?? classType.name) ?? new Pool(classType);
        return pool.acquire();
    }

    /**
     * Releases an instance back to its corresponding pool.
     * @param classInstance The instance to be released.
     */
    static release<T>(classInstance: Pooled<T>) {
        const pool = classInstance[pooledKey];
        if (!pool) {
            const className = classInstance.constructor.className ?? classInstance.constructor.name;
            throw new Error(`Failed to release instance of type ${className}, no pool exists.`);
        }
        pool.release(classInstance);
    }

    /** List of currently available instances in the pool. */
    private freeList: T[] = [];

    /**
     * Creates an instance of Pool.
     * @param classType The constructor of the class this pool will manage.
     * @param increment Number of instances to add when expanding the pool.
     */
    constructor(
        private classType: PoolConstructor<T>,
        private increment = Pool.GrowthFactor
    ) {
        Pool.pools.set(classType.className ?? classType.name, this);
    }

    /**
     * Acquires an instance from the pool or expands the pool if empty.
     * @returns An instance of the pooled class.
     */
    acquire(): T {
        if (this.freeList.length === 0) {
            this.expand(this.increment);
        }
        return this.freeList.pop()!;
    }

    /**
     * Expands the pool by creating new instances.
     * @param increment Number of instances to add.
     */
    expand(increment: number) {
        for (let i = 0; i < increment; i++) {
            const instance = new this.classType() as Pooled<T>;
            instance[pooledKey] = this;
            this.freeList.push(instance);
        }
    }

    /**
     * Releases an instance back into the pool.
     * @param classInstance The instance to be released.
     */
    release(classInstance: Pooled<T>) {
        if (classInstance[pooledKey] !== this) {
            const className = classInstance.constructor.className ?? classInstance.constructor.name;
            throw new Error(`Failed to release instance of type ${className}, expecting ${this.classType.className}.`);
        }
        this.freeList.push(classInstance);
    }

    /** Clears all instances from the pool. */
    cleanup() {
        this.freeList.length = 0;
    }
}
