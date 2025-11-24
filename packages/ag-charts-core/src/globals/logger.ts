/* eslint-disable no-console */

const doOnceCache = new Set<string>();

export const log = console.log.bind(console);
export const warn = console.warn.bind(console, 'AG Charts - ');
export const error = console.error.bind(console, 'AG Charts - ');
export const table = console.table.bind(console);

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

export function logGroup<T>(name: string, cb: () => T): T {
    console.groupCollapsed(name);
    try {
        return cb();
    } finally {
        console.groupEnd();
    }
}
