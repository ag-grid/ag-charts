/* eslint-disable no-console */

type Stringifiable = string | number | boolean;

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

export function warnOnce(message: Stringifiable, ...logContent: any[]) {
    const cacheKey = `Logger.warn: ${message}`;
    if (doOnceCache.has(cacheKey)) return;
    warn(message, ...logContent);
    doOnceCache.add(cacheKey);
}

export function errorOnce(message: Stringifiable, ...logContent: any[]) {
    const cacheKey = `Logger.error: ${message}`;
    if (doOnceCache.has(cacheKey)) return;
    error(message, ...logContent);
    doOnceCache.add(cacheKey);
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
