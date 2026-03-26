/* eslint-disable no-console */

const doOnceCache = new Set<string>();

export function log(...logContent: any[]) {
    console.log(...logContent);
}

export function warn(message: any, ...logContent: any[]) {
    console.warn(`AG Charts - ${message}`, ...logContent);
}

export function error(message: any, ...logContent: any[]) {
    if (typeof message === 'object') {
        console.error(`AG Charts error`, message, ...logContent);
    } else {
        console.error(`AG Charts - ${message}`, ...logContent);
    }
}

export function table(...logContent: any[]) {
    console.table(...logContent);
}

function guardOnce<T>(messageOrError: T, prefix: string, cb: (message: T) => void) {
    let message: string;
    if (messageOrError instanceof Error) {
        message = messageOrError.message;
    } else if (typeof messageOrError === 'string') {
        message = messageOrError;
    } else if (typeof messageOrError === 'object') {
        message = JSON.stringify(messageOrError);
    } else {
        message = String(messageOrError);
    }
    const cacheKey = `${prefix}: ${message}`;
    if (doOnceCache.has(cacheKey)) return;
    cb(messageOrError);
    doOnceCache.add(cacheKey);
}

export function warnOnce(messageOrError: unknown, ...logContent: any[]) {
    guardOnce(messageOrError, 'Logger.warn', (message) => warn(message, ...logContent));
}

export function errorOnce(messageOrError: unknown, ...logContent: any[]) {
    guardOnce(messageOrError, 'Logger.error', (message) => error(message, ...logContent));
}

export function reset() {
    doOnceCache.clear();
}

function isPromise(value: unknown): value is Promise<unknown> {
    return typeof value === 'object' && value !== null && 'then' in value;
}

export function logGroup<T>(name: string, cb: () => T): T {
    console.groupCollapsed(name);
    let syncCleanup = true;
    try {
        const result = cb();
        if (isPromise(result)) {
            syncCleanup = false;
            return result.finally(() => {
                console.groupEnd();
            }) as T;
        }
        return result;
    } finally {
        if (syncCleanup) {
            console.groupEnd();
        }
    }
}
