/* eslint-disable no-console */

const doOnceCache = new Set<string>();

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

// Don't use .bind() at module initialization - it captures console methods before tests can mock them
// Instead, call console methods directly to allow test mocks to intercept
export const log = function (...logContent: any[]) {
    console.log(...logContent);
};

export const warn = function (message: any, ...logContent: any[]) {
    console.warn(`AG Charts - ${message}`, ...logContent);
};

export const error = function (message: any, ...logContent: any[]) {
    if (typeof message === 'object') {
        console.error(`AG Charts error`, message, ...logContent);
    } else {
        console.error(`AG Charts - ${message}`, ...logContent);
    }
};

export const table = function (...logContent: any[]) {
    console.table(...logContent);
};

export const warnOnce = function (messageOrError: unknown, ...logContent: any[]) {
    guardOnce(messageOrError, 'Logger.warn', (message) => warn(message, ...logContent));
};

export const errorOnce = function (messageOrError: unknown, ...logContent: any[]) {
    guardOnce(messageOrError, 'Logger.error', (message) => error(message, ...logContent));
};

export const reset = function () {
    doOnceCache.clear();
};

export const logGroup = function <T>(name: string, cb: () => T): T {
    console.groupCollapsed(name);
    try {
        return cb();
    } finally {
        console.groupEnd();
    }
};
