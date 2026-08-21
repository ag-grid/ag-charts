import { CleanupRegistry } from '../state/cleanupRegistry';

type ServiceFactory<TRegistry, K extends keyof TRegistry> = (ctx: DynamicContext<TRegistry>) => TRegistry[K];

interface Destroyable {
    destroy(): void;
}

export interface DynamicContextApi<TRegistry> {
    readonly cleanup: CleanupRegistry;

    constant<K extends string & keyof TRegistry>(name: K, value: TRegistry[K]): DynamicContext<TRegistry>;
    /**
     * Register a value whose lifecycle is managed externally. Behaves like {@link constant}
     * but is skipped by the destroy cascade — use for inputs (e.g. the chart itself) that
     * outlive or outside-own the context.
     */
    ref<K extends string & keyof TRegistry>(name: K, value: TRegistry[K]): DynamicContext<TRegistry>;
    service<K extends string & keyof TRegistry>(
        name: K,
        factory: ServiceFactory<TRegistry, K>
    ): DynamicContext<TRegistry>;
    factory<K extends string & keyof TRegistry>(
        name: K,
        factory: ServiceFactory<TRegistry, K>
    ): DynamicContext<TRegistry>;

    has(name: string): boolean;
    child<TChild>(): DynamicContext<TRegistry & TChild>;
    destroy(): void;
}

export type DynamicContext<TRegistry> = DynamicContextApi<TRegistry> & Readonly<TRegistry>;

// TypeScript cannot verify defineProperty-based registrations satisfy Readonly<TRegistry>.
function asDynamicContext<TRegistry>(impl: DynamicContextImpl<TRegistry>): DynamicContext<TRegistry> {
    return impl as unknown as DynamicContext<TRegistry>;
}

// Internal state lives in a WeakMap rather than own properties: every registered service name becomes
// an own property via defineProperty and would otherwise collide with internal bookkeeping.
interface InternalState<TRegistry> {
    readonly cleanup: CleanupRegistry;
    readonly self: DynamicContext<TRegistry>;
    readonly resolving: Set<string>;
    readonly children: Set<Destroyable>;
    readonly parent?: DynamicContextImpl<TRegistry>;
    /** Keys registered via `ref()` — excluded from destroy cascade. */
    readonly refs: Set<string>;
    destroyed: boolean;
}

const state = new WeakMap<DynamicContextImpl<any>, InternalState<any>>();

function internal<TRegistry>(impl: DynamicContextImpl<TRegistry>): InternalState<TRegistry> {
    const s = state.get(impl);
    if (!s) throw new Error('AG Charts - DynamicContext: missing internal state.');
    return s;
}

class DynamicContextImpl<TRegistry> {
    constructor(parent?: DynamicContextImpl<TRegistry>) {
        const s: InternalState<TRegistry> = {
            cleanup: new CleanupRegistry(),
            self: asDynamicContext(this),
            resolving: new Set<string>(),
            children: new Set<Destroyable>(),
            refs: new Set<string>(),
            parent,
            destroyed: false,
        };
        state.set(this, s);
        if (parent) {
            internal(parent).children.add(this);
        }
    }

    get cleanup(): CleanupRegistry {
        return internal(this).cleanup;
    }

    constant<K extends string & keyof TRegistry>(name: K, value: TRegistry[K]): DynamicContext<TRegistry> {
        this.assertNotDestroyed();
        Object.defineProperty(this, name, { value, configurable: true, enumerable: true });
        return internal(this).self;
    }

    ref<K extends string & keyof TRegistry>(name: K, value: TRegistry[K]): DynamicContext<TRegistry> {
        this.assertNotDestroyed();
        const s = internal(this);
        s.refs.add(name);
        Object.defineProperty(this, name, { value, configurable: true, enumerable: true });
        return s.self;
    }

    service<K extends string & keyof TRegistry>(name: K, fn: ServiceFactory<TRegistry, K>): DynamicContext<TRegistry> {
        this.assertNotDestroyed();
        Object.defineProperty(this, name, {
            configurable: true,
            enumerable: true,
            get: () => {
                const value = this.resolve(name, fn);
                Object.defineProperty(this, name, { value, configurable: true, enumerable: true });
                return value;
            },
        });
        return internal(this).self;
    }

    factory<K extends string & keyof TRegistry>(name: K, fn: ServiceFactory<TRegistry, K>): DynamicContext<TRegistry> {
        this.assertNotDestroyed();
        Object.defineProperty(this, name, {
            configurable: true,
            enumerable: true,
            get: () => this.resolve(name, fn),
        });
        return internal(this).self;
    }

    has(name: string): boolean {
        return name in this;
    }

    child<TChild>(): DynamicContext<TRegistry & TChild> {
        const c = new DynamicContextImpl<TRegistry & TChild>(this as DynamicContextImpl<TRegistry & TChild>);
        Object.setPrototypeOf(c, this);
        return asDynamicContext(c);
    }

    destroy(): void {
        const s = internal(this);
        if (s.destroyed) return;
        s.destroyed = true;

        for (const c of s.children) {
            c.destroy();
        }
        s.children.clear();

        // Destroy in reverse-registration order: dependents tear down before the services they rely on.
        const keys = Object.keys(this);
        for (let i = keys.length - 1; i >= 0; i--) {
            const key = keys[i];
            // Externally-managed references opt out of the destroy cascade.
            if (s.refs.has(key)) continue;

            const descriptor = Object.getOwnPropertyDescriptor(this, key);
            // Getters indicate uninitialised services — only resolved value descriptors need destroying.
            if (descriptor?.value != null && typeof descriptor.value === 'object') {
                (descriptor.value as Partial<Destroyable>).destroy?.();
            }
        }

        s.cleanup.flush();

        if (s.parent) {
            internal(s.parent).children.delete(this);
        }
    }

    private resolve<K extends string & keyof TRegistry>(name: K, fn: ServiceFactory<TRegistry, K>): TRegistry[K] {
        const s = internal(this);
        // Block lazy construction on a destroyed context: a getter firing after destroy() would spin up a
        // new service on a dead chart and reattach listeners/DOM bindings — a zombie leak.
        if (s.destroyed) {
            throw new Error(`AG Charts - DynamicContext: cannot resolve '${name}' on a destroyed context.`);
        }
        if (s.resolving.has(name)) {
            throw new Error(`AG Charts - DynamicContext: circular dependency detected while resolving '${name}'.`);
        }
        s.resolving.add(name);
        try {
            return fn(s.self);
        } finally {
            s.resolving.delete(name);
        }
    }

    private assertNotDestroyed(): void {
        if (internal(this).destroyed) {
            throw new Error('AG Charts - DynamicContext: cannot register on a destroyed context.');
        }
    }
}

export function createDynamicContext<TRegistry>(): DynamicContext<TRegistry> {
    return asDynamicContext(new DynamicContextImpl<TRegistry>());
}
