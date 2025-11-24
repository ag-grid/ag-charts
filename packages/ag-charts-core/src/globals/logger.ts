/* eslint-disable no-console */

const doOnceCache = new Set<string>();

const consoleLog = console.log.bind(console);
const consoleWarn = console.warn.bind(console);
const consoleError = console.error.bind(console);
const consoleTable = console.table.bind(console);

export function log(...logContent: any[]) {
    consoleLog(...logContent);
}

export function warn(message: any, ...logContent: any[]) {
    consoleWarn(`AG Charts - ${message}`, ...logContent);
}

export function error(message: any, ...logContent: any[]) {
    if (typeof message === 'object') {
        consoleError(`AG Charts error`, message, ...logContent);
    } else {
        consoleError(`AG Charts - ${message}`, ...logContent);
    }
}

export function table(...logContent: any[]) {
    consoleTable(...logContent);
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

const consoleGroupCollapsed = console.groupCollapsed.bind(console);
const consoleGroupEnd = console.groupEnd.bind(console);

export function logGroup<T>(name: string, cb: () => T): T {
    consoleGroupCollapsed(name);
    try {
        return cb();
    } finally {
        consoleGroupEnd();
    }
}
