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

// Destroyed objects are turned into 'zombie objects' like it ObjC/Swift.
// Do not override destroy(), only implement the destructor().
export abstract class Destructible implements Destroyable {
    destroy() {
        // Automatically destroy any destructible members
        for (const key of Object.keys(this)) {
            const property = (this as any)[key];
            if (isDestroyable(property)) {
                property.destroy();
            }
        }
        this.destructor();

        // Loop through object methods and properties and replace them with stubs that throw ZombieError
        for (const key of Object.getOwnPropertyNames(Object.getPrototypeOf(this))) {
            if (typeof (this as any)[key] === 'function' && key !== 'constructor') {
                (this as any)[key] = () => {
                    throw new ZombieError(`Method '${key}' cannot be called on a destroyed object ${this}.`);
                };
            }
        }

        // Nullify all instance properties (optional but helpful)
        for (const key of Object.keys(this)) {
            (this as any)[key] = null;
        }
    }

    protected abstract destructor(): void;
}

// Arrays with a destroy() method and destructor.
// Do not override destroy(), only implement the destructor().
class DestructibleArray<T> extends Array<T> implements Destroyable  {
    destroy() {
        this.destructor();
    }

    protected destructor() {
        for (const elem of this) {
            if (isDestroyable( elem)) {
                elem.destroy();
            }
        }
        this.length = 0;
    }
}

export class DestroyFns extends DestructibleArray<()=>void> {
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
