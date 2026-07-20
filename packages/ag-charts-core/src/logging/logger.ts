/* eslint-disable no-console */

// Minimum console severity a Logger emits (higher = quieter). The default of 0 admits every message,
// so a default Logger's output matches an ungated one.
const SEVERITY = { warn: 1, error: 2 } as const;

export class Logger {
    private readonly doOnceCache = new Set<string>();

    constructor(private readonly minSeverity: number = 0) {}

    log(...logContent: any[]) {
        console.log(...logContent);
    }

    warn(message: any, ...logContent: any[]) {
        if (this.minSeverity > SEVERITY.warn) return;
        console.warn(`AG Charts - ${message}`, ...logContent);
    }

    error(message: any, ...logContent: any[]) {
        if (this.minSeverity > SEVERITY.error) return;
        if (typeof message === 'object') {
            console.error(`AG Charts error`, message, ...logContent);
        } else {
            console.error(`AG Charts - ${message}`, ...logContent);
        }
    }

    table(...logContent: any[]) {
        console.table(...logContent);
    }

    private guardOnce<T>(messageOrError: T, prefix: string, cb: (message: T) => void) {
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
        if (this.doOnceCache.has(cacheKey)) return;
        cb(messageOrError);
        this.doOnceCache.add(cacheKey);
    }

    warnOnce(messageOrError: unknown, ...logContent: any[]) {
        this.guardOnce(messageOrError, 'Logger.warn', (message) => this.warn(message, ...logContent));
    }

    errorOnce(messageOrError: unknown, ...logContent: any[]) {
        this.guardOnce(messageOrError, 'Logger.error', (message) => this.error(message, ...logContent));
    }

    reset() {
        this.doOnceCache.clear();
    }

    destroy() {
        this.doOnceCache.clear();
    }

    logGroup<T>(name: string, cb: () => T): T {
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

    static log(...logContent: any[]) {
        defaultLogger.log(...logContent);
    }
    static warn(message: any, ...logContent: any[]) {
        defaultLogger.warn(message, ...logContent);
    }
    static error(message: any, ...logContent: any[]) {
        defaultLogger.error(message, ...logContent);
    }
    static table(...logContent: any[]) {
        defaultLogger.table(...logContent);
    }
    static warnOnce(messageOrError: unknown, ...logContent: any[]) {
        defaultLogger.warnOnce(messageOrError, ...logContent);
    }
    static errorOnce(messageOrError: unknown, ...logContent: any[]) {
        defaultLogger.errorOnce(messageOrError, ...logContent);
    }
    static reset() {
        defaultLogger.reset();
    }
    static logGroup<T>(name: string, cb: () => T): T {
        return defaultLogger.logGroup(name, cb);
    }
}

function isPromise(value: unknown): value is Promise<unknown> {
    return typeof value === 'object' && value !== null && 'then' in value;
}

// One module-default instance backs both the `Logger.*` statics and the free functions below, so every
// chart-less call path shares a single dedup cache and `reset()`.
const defaultLogger = new Logger();

export const log = (...logContent: any[]) => defaultLogger.log(...logContent);
export const warn = (message: any, ...logContent: any[]) => defaultLogger.warn(message, ...logContent);
export const error = (message: any, ...logContent: any[]) => defaultLogger.error(message, ...logContent);
export const table = (...logContent: any[]) => defaultLogger.table(...logContent);
export const warnOnce = (messageOrError: unknown, ...logContent: any[]) =>
    defaultLogger.warnOnce(messageOrError, ...logContent);
export const errorOnce = (messageOrError: unknown, ...logContent: any[]) =>
    defaultLogger.errorOnce(messageOrError, ...logContent);
export const reset = () => defaultLogger.reset();
export const logGroup = <T>(name: string, cb: () => T): T => defaultLogger.logGroup(name, cb);
