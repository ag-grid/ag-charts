interface DebounceOptions {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
}

interface ThrottleOptions {
    leading?: boolean;
    trailing?: boolean;
}

const doOnceState = new Map<string, boolean>();

/**
 * If the key was passed before, then doesn't execute the func
 */
export function doOnce(func: () => void, key: string) {
    if (doOnceState.has(key)) return;
    doOnceState.set(key, true);
    func();
}

/** Clear doOnce() state (for test purposes). */
doOnce.clear = () => doOnceState.clear();

export function identity<T>(x: T): T {
    return x;
}

export function* iterate<T extends Iterable<any>[]>(
    ...iterators: T
): Generator<T[number] extends Iterable<infer U> ? U : never, void, undefined> {
    for (const iterator of iterators) {
        yield* iterator;
    }
}

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

export function throttle<T extends (...args: Parameters<T>) => void>(
    callback: T,
    waitMs = 0,
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
