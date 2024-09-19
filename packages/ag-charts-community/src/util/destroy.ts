class ZombieError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ZombieError';
    }
}

interface Destroyable {
    destroy(): void;
}

function isDestroyable(obj: unknown): obj is Destroyable {
    return typeof obj === 'object' && obj != null && 'destroy' in obj && typeof obj['destroy'] === 'function';
}

function isWeak(obj: unknown): obj is WeakRef<object> {
    return obj instanceof WeakRef;
}

// Destroyed objects are turned into 'zombie objects' like it ObjC/Swift.
// Do not override destroy(), only implement the destructor().
export abstract class Destructible implements Destroyable {
    destroy() {
        // Automatically destroy any destructible members
        for (const key of Object.keys(this)) {
            const property = (this as any)[key];
            if (isDestroyable(property) && !isWeak(property)) {
                property.destroy();
            }
        }
        this.destructor();

        // Loop through object methods and properties and replace them with stubs that throw ZombieError
        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(this))) {
            if (typeof (this as any)[key] === 'function' && key !== 'constructor') {
                (this as any)[key] = () => {
                    throw new ZombieError(`Method '${key}' cannot be called on a destroyed object.`);
                };
            }
        }

        this.nullifyProperties();
    }

    private nullifyProperties() {
        for (const key of Object.keys(this)) {
            // Define getter and setter that throws an error when accessed
            Object.defineProperty(this, key, {
                get() {
                    throw new ZombieError(`Property '${key}' cannot be accessed on a destroyed object.`);
                },
                set(_value: unknown) {
                    throw new ZombieError(`Property '${key}' cannot be modified on a destroyed object.`);
                },
                configurable: true,
            });
        }
    }

    protected abstract destructor(): void;
}

// Arrays with a destroy() method and destructor.
// Do not override destroy(), only implement the destructor().
class DestructibleArray<T> extends Array<T> implements Destroyable {
    destroy() {
        this.destructor();
    }

    protected destructor() {
        for (const elem of this) {
            if (isDestroyable(elem)) {
                elem.destroy();
            }
        }
        this.length = 0;
    }
}

export class DestroyFns extends DestructibleArray<() => void> {
    protected override destructor() {
        this.clear();
    }

    clear() {
        this.forEach((fn) => fn());
        this.length = 0;
    }

    setFns(destroyFns: (() => void)[]) {
        this.clear();
        this.push(...destroyFns);
    }
}

class UniqueOptionalRef<T extends Destroyable> extends Destructible {
    constructor(private guardedPtr?: T) {
        super();
    }
    destructor() {
        this.guardedPtr?.destroy();
    }
    setref(ref: T | undefined): T | undefined {
        const oldRef = this.guardedPtr;
        this.guardedPtr?.destroy();
        this.guardedPtr = ref;
        return oldRef;
    }
    deref(): T | undefined {
        return this.guardedPtr;
    }
}

export function weak(target: unknown, propertyKey: string): void {
    const privatePropertyKey = `_${propertyKey}`;
    Object.defineProperty(target, propertyKey, {
        get: function () {
            const weakRef: WeakRef<any> = this[privatePropertyKey];
            return weakRef ? weakRef.deref() : undefined;
        },
        set: function (newValue: any) {
            this[privatePropertyKey] = new WeakRef(newValue);
        },
        configurable: true,
        enumerable: true,
    });
}

export function unique(target: unknown, propertyKey: string): void {
    const privatePropertyKey = `_${propertyKey}`;
    (target as any)[privatePropertyKey] = new UniqueOptionalRef();
    Object.defineProperty(target, propertyKey, {
        get: function () {
            const ref: UniqueOptionalRef<Destroyable> = this[privatePropertyKey];
            return ref?.deref();
        },
        set: function (newValue: any) {
            const ref: UniqueOptionalRef<Destroyable> = this[privatePropertyKey];
            ref.setref(newValue);
        },
        configurable: true,
        enumerable: true,
    });
}
