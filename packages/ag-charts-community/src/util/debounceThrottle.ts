/**
 * Execute a function once after a time period of `ms` milliseconds since it was last called.
 */
export function debounce<T extends (...args: Parameters<T>) => any>(this: ThisParameterType<T>, fn: T, ms: number) {
    let timeout: ReturnType<typeof setTimeout> | undefined;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn.apply(this, args), ms);
    };
}

/**
 * Resolve an asynchronous function once after a time period of `ms` milliseconds since it was last called.
 */
export function debounceAsync<T extends (...args: Parameters<T>) => any>(
    this: ThisParameterType<T>,
    fn: T,
    ms: number
) {
    let cancel = () => {};
    return (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
        cancel();
        return new Promise((resolve) => {
            const timeout = setTimeout(() => resolve(fn.apply(this, args)), ms);
            cancel = () => {
                clearTimeout(timeout);
            };
        });
    };
}

/**
 * Throttle an asynchronous function to be called no more than once in each time period of `ms` milliseconds, at the
 * leading edge of the period.
 */
export function throttleAsyncLeading<T extends (...args: Parameters<T>) => any>(
    this: ThisParameterType<T>,
    fn: T,
    ms: number
) {
    let delayPromise = Promise.resolve();
    let returnPromise: Promise<Awaited<ReturnType<T>>> | undefined;

    return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
        await delayPromise;
        if (returnPromise) return returnPromise;
        delayPromise = new Promise<void>((resolve) => setTimeout(resolve, ms));
        returnPromise = (fn.apply(this, args) as Promise<Awaited<ReturnType<T>>>).finally(() => {
            returnPromise = undefined;
        });
        return returnPromise;
    };
}

/**
 * Throttle an asynchronous function to be called no more than once in each time period of `ms` milliseconds, at the
 * trailing edge of the period.
 */
export function throttleAsyncTrailing<T extends (...args: Parameters<T>) => any>(
    this: ThisParameterType<T>,
    fn: T,
    ms: number
) {
    let hasTimeout = false;
    let latestArgs: Parameters<T>;
    return (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
        latestArgs = args;
        return new Promise((resolve) => {
            if (hasTimeout) return;
            hasTimeout = true;
            setTimeout(() => {
                resolve(fn.apply(this, latestArgs));
                hasTimeout = false;
            }, ms);
        });
    };
}
