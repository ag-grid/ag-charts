import type { AnyFn } from '../types/global';

type RegisteredCallback = AnyFn | false | null | undefined;

export class CleanupRegistry {
    protected readonly callbacks = new Set<AnyFn>();

    public flush() {
        for (const cb of this.callbacks) {
            cb();
        }
        this.callbacks.clear();
    }

    public merge(registry: CleanupRegistry) {
        for (const cb of registry.callbacks) {
            this.callbacks.add(cb);
        }
    }

    public register(...callbacks: RegisteredCallback[]) {
        for (const cb of callbacks) {
            if (!cb) continue;
            this.callbacks.add(cb);
        }
    }
}
