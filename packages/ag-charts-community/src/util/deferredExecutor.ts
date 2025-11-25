import { getWindow } from 'ag-charts-core';

export interface DeferredExecutorOptions {
    /** Maximum time to wait before forcing execution (ms). Default: 100 */
    timeout?: number;
}

interface PendingWork<T> {
    computation: () => T;
    onComplete: (result: T) => void;
}

/**
 * Manages deferred execution of computations, allowing work to be scheduled
 * for idle time while supporting on-demand execution and cancellation.
 *
 * Uses `requestIdleCallback` when available, falling back to `setTimeout`.
 */
export class DeferredExecutor<T> {
    private readonly timeout: number;
    private pending?: PendingWork<T>;
    private scheduledId?: number;

    constructor(options?: DeferredExecutorOptions) {
        this.timeout = options?.timeout ?? 100;
    }

    /**
     * Schedule a computation for deferred execution.
     * If something is already pending, it will be cancelled first.
     */
    schedule(computation: () => T, onComplete: (result: T) => void): void {
        this.cancel();

        this.pending = { computation, onComplete };

        const window = getWindow();
        if (typeof window.requestIdleCallback === 'function') {
            this.scheduledId = window.requestIdleCallback(this.execute.bind(this), { timeout: this.timeout });
        } else {
            // Fallback for environments without requestIdleCallback
            this.scheduledId = setTimeout(() => this.execute(), this.timeout) as unknown as number;
        }
    }

    /**
     * Force immediate execution if pending.
     * @returns The computation result, or undefined if nothing was pending.
     */
    demand(): T | undefined {
        if (!this.pending) {
            return undefined;
        }

        this.cancelScheduled();
        return this.execute();
    }

    /**
     * Cancel any pending execution without running it.
     */
    cancel(): void {
        this.cancelScheduled();
        this.pending = undefined;
    }

    /**
     * Check if there's pending work.
     */
    isPending(): boolean {
        return this.pending != null;
    }

    private cancelScheduled(): void {
        if (this.scheduledId == null) {
            return;
        }

        const window = getWindow();
        if (typeof window.cancelIdleCallback === 'function') {
            window.cancelIdleCallback(this.scheduledId);
        } else {
            clearTimeout(this.scheduledId);
        }
        this.scheduledId = undefined;
    }

    private execute(): T | undefined {
        const pending = this.pending;
        if (!pending) {
            return undefined;
        }

        this.pending = undefined;
        this.scheduledId = undefined;

        const result = pending.computation();
        pending.onComplete(result);
        return result;
    }
}
