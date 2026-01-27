import { warnOnce } from '../logging/logger';

interface DebounceOptions {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
}

interface ThrottleOptions {
    leading?: boolean;
    trailing?: boolean;
}

/**
 * Creates a debounced function that delays invoking the provided callback until
 * after `waitMs` milliseconds have elapsed since the last time the function was called.
 *
 * @template T - The type of the callback function.
 * @param callback - The function to debounce.
 * @param waitMs - The number of milliseconds to delay (default is 0).
 * @param options - Optional configuration:
 *  - `leading` (default: false): If true, the callback will be invoked on the leading edge of the timeout.
 *  - `trailing` (default: true): If true, the callback will be invoked on the trailing edge of the timeout.
 *  - `maxWait` (default: Infinity): The maximum time the callback can be delayed before it's invoked.
 * @returns A debounced version of the callback with a `cancel` method to clear the timer.
 * @throws If `maxWait` is less than `waitMs`.
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
    callback: T,
    waitMs = 0,
    options?: DebounceOptions
) {
    const { leading = false, trailing = true, maxWait = Infinity } = options ?? {};
    let timerId: NodeJS.Timeout | number;
    let startTime: number | null;

    if (maxWait < waitMs) {
        throw new Error('Value of maxWait cannot be lower than waitMs.');
    }

    function debounceCallback(...args: Parameters<T>) {
        if (leading && !startTime) {
            startTime = Date.now();
            timerId = setTimeout(() => (startTime = null), waitMs);
            callback(...args);
            return;
        }
        let adjustedWaitMs = waitMs;
        if (maxWait !== Infinity && startTime) {
            const elapsedTime = Date.now() - startTime;
            if (waitMs > maxWait - elapsedTime) {
                adjustedWaitMs = maxWait - elapsedTime;
            }
        }
        clearTimeout(timerId);
        startTime ??= Date.now();
        timerId = setTimeout(() => {
            startTime = null;
            if (trailing) {
                callback(...args);
            }
        }, adjustedWaitMs);
    }

    return Object.assign(debounceCallback, {
        cancel() {
            clearTimeout(timerId);
            startTime = null;
        },
    });
}

/**
 * Creates a throttled function that only invokes the provided callback at most once
 * every `waitMs` milliseconds.
 *
 * @template T - The type of the callback function.
 * @param callback - The function to throttle.
 * @param waitMs - The number of milliseconds to throttle invocations.
 * @param options - Optional configuration:
 *  - `leading` (default: true): If true, the callback will be invoked on the leading edge of the timeout.
 *  - `trailing` (default: true): If true, the callback will be invoked on the trailing edge of the timeout.
 * @returns A throttled version of the callback with a `cancel` method to clear the timer.
 */
export function throttle<T extends (...args: Parameters<T>) => void>(
    callback: T,
    waitMs: number,
    options?: ThrottleOptions
) {
    const { leading = true, trailing = true } = options ?? {};
    let timerId: NodeJS.Timeout | number;
    let lastArgs: unknown[] | null;
    let shouldWait = false;

    function timeoutHandler() {
        if (trailing && lastArgs) {
            timerId = setTimeout(timeoutHandler, waitMs);
            callback(...(lastArgs as Parameters<T>));
        } else {
            shouldWait = false;
        }
        lastArgs = null;
    }

    function throttleCallback(...args: Parameters<T>) {
        if (shouldWait) {
            lastArgs = args;
        } else {
            shouldWait = true;
            timerId = setTimeout(timeoutHandler, waitMs);
            if (leading) {
                callback(...args);
            } else {
                lastArgs = args;
            }
        }
    }

    return Object.assign(throttleCallback, {
        cancel() {
            clearTimeout(timerId);
            shouldWait = false;
            lastArgs = null;
        },
    });
}

export function safeCall<T = unknown>(callback: Function, args: any[], errorPath = ''): T | undefined {
    try {
        return callback(...args);
    } catch (error) {
        const postfix = errorPath ? ` \`${errorPath}\`` : '';
        warnOnce(`Uncaught exception in user callback${postfix}`, error);
    }
}

export function isNullOrUndefined(value: unknown): boolean {
    return value === null || value === undefined;
}
