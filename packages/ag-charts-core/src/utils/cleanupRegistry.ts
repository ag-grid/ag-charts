import type { AnyFn } from '../interfaces/globalTypes';

type RegisteredCallback = AnyFn | undefined | null;

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
            if (cb == null) continue;
            this.callbacks.add(cb);
        }
    }
}
