import { getWindow } from 'ag-charts-core';

export interface DeferredExecutorOptions {
    /** Minimum time to wait before execution can begin (ms). Default: 0 */
    minimumDelay?: number;
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
    private readonly minimumDelay: number;
    private readonly timeout: number;
    private pending?: PendingWork<T>;
    private delayTimeoutId?: number;
    private idleCallbackId?: number;

    constructor(options?: DeferredExecutorOptions) {
        this.minimumDelay = options?.minimumDelay ?? 50;
        this.timeout = options?.timeout ?? 100;
    }

    /**
     * Schedule a computation for deferred execution.
     * If something is already pending, it will be cancelled first.
     */
    schedule(computation: () => T, onComplete: (result: T) => void): void {
        this.cancel();

        this.pending = { computation, onComplete };

        if (this.minimumDelay > 0) {
            this.delayTimeoutId = setTimeout(() => {
                this.delayTimeoutId = undefined;
                this.scheduleIdleCallback();
            }, this.minimumDelay) as unknown as number;
        } else {
            this.scheduleIdleCallback();
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

    private scheduleIdleCallback(): void {
        const window = getWindow();
        const remainingTimeout = Math.max(0, this.timeout - this.minimumDelay);
        
        if (typeof window.requestIdleCallback === 'function') {
            this.idleCallbackId = window.requestIdleCallback(this.execute.bind(this), { timeout: remainingTimeout });
        } else {
            // Fallback for environments without requestIdleCallback
            this.idleCallbackId = setTimeout(() => this.execute(), remainingTimeout) as unknown as number;
        }
    }

    private cancelScheduled(): void {
        if (this.delayTimeoutId != null) {
            clearTimeout(this.delayTimeoutId);
            this.delayTimeoutId = undefined;
        }

        if (this.idleCallbackId == null) {
            return;
        }

        const window = getWindow();
        if (typeof window.cancelIdleCallback === 'function') {
            window.cancelIdleCallback(this.idleCallbackId);
        } else {
            clearTimeout(this.idleCallbackId);
        }
        this.idleCallbackId = undefined;
    }

    private execute(): T | undefined {
        const pending = this.pending;
        if (!pending) {
            return undefined;
        }

        this.pending = undefined;
        this.delayTimeoutId = undefined;
        this.idleCallbackId = undefined;

        const result = pending.computation();
        pending.onComplete(result);
        return result;
    }
}
