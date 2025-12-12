import { getWindow } from 'ag-charts-core';

// SONARCLOUD EXCEPTION (S6836): Named function declarations are intentionally used throughout
// this file instead of arrow functions. Named functions appear properly in Chrome DevTools
// profiler, whereas anonymous arrow functions get grouped together making profiling difficult.

type VoidCallback = {
    (): void;
};

type SchedulerFunction = {
    (cb: VoidCallback, delayMs?: number): number | void;
};

type CancelFunction = {
    (id: number | void): void;
};

type Callback = {
    (params: { count: number }): Promise<void> | void;
};

/**
 * Wrap a function in debouncing trigger function. A requestAnimationFrame() is scheduled
 * after the first schedule() call, and subsequent schedule() calls will be ignored until the
 * animation callback executes.
 */
export function debouncedAnimationFrame(cb: Callback): {
    schedule(delayMs?: number): void;
    cancel(): void;
    waitForCompletion(): Promise<void>;
} {
    const window = getWindow();

    function scheduleWithAnimationFrame(innerCb: VoidCallback, _delayMs?: number): number {
        return window.requestAnimationFrame(innerCb);
    }

    function cancelWithAnimationFrame(id: number | void): void {
        window.cancelAnimationFrame(id as number);
    }

    return buildScheduler(scheduleWithAnimationFrame, cb, cancelWithAnimationFrame);
}

export function debouncedCallback(cb: Callback): {
    schedule(delayMs?: number): void;
    cancel(): void;
    waitForCompletion(): Promise<void>;
} {
    function scheduleWithDelay(innerCb: VoidCallback, delayMs = 0): number | void {
        if (delayMs === 0) {
            queueMicrotask(innerCb);
            return undefined;
        }

        return setTimeout(innerCb, delayMs) as unknown as number;
    }

    function cancelWithTimeout(id: number | void): void {
        clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
    }

    return buildScheduler(scheduleWithDelay, cb, cancelWithTimeout);
}

function buildScheduler(scheduleFn: SchedulerFunction, cb: Callback, cancelFn?: CancelFunction) {
    let scheduleCount = 0;
    let promiseRunning = false;
    let awaitingPromise: Promise<void> | undefined;
    let awaitingDone: VoidCallback | undefined;
    let scheduledId: number | void;

    function busy(): boolean {
        return promiseRunning;
    }

    function done(): void {
        promiseRunning = false;
        scheduledId = undefined;

        awaitingDone?.();
        awaitingDone = undefined;
        awaitingPromise = undefined;

        if (scheduleCount > 0) {
            scheduledId = scheduleFn(scheduleCallback);
        }
    }

    function scheduleCallback(): void {
        const count = scheduleCount;

        scheduleCount = 0;
        promiseRunning = true;
        const maybePromise = cb({ count });

        if (!maybePromise) {
            done();
            return;
        }

        maybePromise.then(done, done);
    }

    function schedule(delayMs?: number): void {
        if (scheduleCount === 0 && !busy()) {
            scheduledId = scheduleFn(scheduleCallback, delayMs);
        }
        scheduleCount++;
    }

    function cancel(): void {
        if (scheduledId != null && cancelFn) {
            cancelFn(scheduledId);
            scheduledId = undefined;
            scheduleCount = 0;
        }
    }

    async function waitForCompletion(): Promise<void> {
        if (!busy()) {
            return;
        }

        awaitingPromise ??= new Promise(resolveAwaitingPromise);

        while (busy()) {
            await awaitingPromise;
        }
    }

    function resolveAwaitingPromise(resolve: VoidCallback): void {
        awaitingDone = resolve;
    }

    return {
        schedule,
        cancel,
        waitForCompletion,
    };
}
