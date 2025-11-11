import { getWindow } from 'ag-charts-core';

type Callback = (params: { count: number }) => Promise<void> | void;

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
    return buildScheduler(
        (innerCb, _delayMs) => window.requestAnimationFrame(innerCb),
        cb,
        (id) => window.cancelAnimationFrame(id as number)
    );
}

export function debouncedCallback(cb: Callback): {
    schedule(delayMs?: number): void;
    cancel(): void;
    waitForCompletion(): Promise<void>;
} {
    return buildScheduler(
        (innerCb, delayMs = 0) => {
            if (delayMs === 0) {
                queueMicrotask(innerCb);
                return undefined;
            }
            return setTimeout(innerCb, delayMs) as unknown as number;
        },
        cb,
        (id) => clearTimeout(id as unknown as ReturnType<typeof setTimeout>)
    );
}

function buildScheduler(
    scheduleFn: (cb: () => void, delayMs?: number) => number | void,
    cb: Callback,
    cancelFn?: (id: number | void) => void
) {
    let scheduleCount = 0;
    let promiseRunning = false;
    let awaitingPromise: Promise<void> | undefined;
    let awaitingDone: (() => void) | undefined;
    let scheduledId: number | void;

    const busy = () => {
        return promiseRunning;
    };

    const done = () => {
        promiseRunning = false;
        scheduledId = undefined;

        awaitingDone?.();
        awaitingDone = undefined;
        awaitingPromise = undefined;

        if (scheduleCount > 0) {
            scheduledId = scheduleFn(scheduleCb);
        }
    };

    const scheduleCb = () => {
        const count = scheduleCount;

        scheduleCount = 0;
        promiseRunning = true;
        const maybePromise = cb({ count });

        if (!maybePromise) {
            done();
            return;
        }

        maybePromise.then(done, done);
    };

    return {
        schedule(delayMs?: number) {
            if (scheduleCount === 0 && !busy()) {
                scheduledId = scheduleFn(scheduleCb, delayMs);
            }
            scheduleCount++;
        },
        cancel() {
            if (scheduledId != null && cancelFn) {
                cancelFn(scheduledId);
                scheduledId = undefined;
                scheduleCount = 0;
            }
        },
        async waitForCompletion() {
            if (!busy()) {
                return;
            }

            awaitingPromise ??= new Promise((resolve) => {
                awaitingDone = resolve;
            });

            while (busy()) {
                await awaitingPromise;
            }
        },
    };
}
