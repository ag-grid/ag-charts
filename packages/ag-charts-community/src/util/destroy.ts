class ZombieError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'ZombieError';
    }
}

// Destroyed objects are turned into 'zombie objects' like it ObjC/Swift.
export abstract class Destructible {
    destroy() {
        // Automatically destroy any destructible members
        for (const key of Object.keys(this)) {
            const property = (this as any)[key];
            if (property instanceof Destructible) {
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

export class DestroyFns extends Destructible {
    private destroyFns: (() => void)[] = [];

    destructor() {
        this.clear();
    }

    clear() {
        this.destroyFns.forEach((fn) => fn());
        this.destroyFns.length = 0;
    }

    push(...destroyFns: (() => void)[]) {
        this.destroyFns.push(...destroyFns);
    }

    setFns(destroyFns: (() => void)[]) {
        this.clear();
        this.destroyFns = destroyFns;
    }
}
