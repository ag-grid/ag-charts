/* eslint-disable no-console */

// Minimum console severity a Logger emits (higher = quieter). The default of 0 admits every message,
// so a default Logger's output matches an ungated one.
const SEVERITY = { warn: 1, error: 2 } as const;

export class Logger {
    // Shared module-default instance backing the `Logger.*` statics and the free functions below, so every
    // chart-less call path shares one dedup cache and `reset()`. The sanctioned fallback for code with no chart.
    static readonly default = new Logger();

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
        Logger.default.log(...logContent);
    }
    static warn(message: any, ...logContent: any[]) {
        Logger.default.warn(message, ...logContent);
    }
    static error(message: any, ...logContent: any[]) {
        Logger.default.error(message, ...logContent);
    }
    static table(...logContent: any[]) {
        Logger.default.table(...logContent);
    }
    static warnOnce(messageOrError: unknown, ...logContent: any[]) {
        Logger.default.warnOnce(messageOrError, ...logContent);
    }
    static errorOnce(messageOrError: unknown, ...logContent: any[]) {
        Logger.default.errorOnce(messageOrError, ...logContent);
    }
    static reset() {
        Logger.default.reset();
    }
    static logGroup<T>(name: string, cb: () => T): T {
        return Logger.default.logGroup(name, cb);
    }
}

function isPromise(value: unknown): value is Promise<unknown> {
    return typeof value === 'object' && value !== null && 'then' in value;
}

export const log = (...logContent: any[]) => Logger.default.log(...logContent);
export const warn = (message: any, ...logContent: any[]) => Logger.default.warn(message, ...logContent);
export const error = (message: any, ...logContent: any[]) => Logger.default.error(message, ...logContent);
export const table = (...logContent: any[]) => Logger.default.table(...logContent);
export const warnOnce = (messageOrError: unknown, ...logContent: any[]) =>
    Logger.default.warnOnce(messageOrError, ...logContent);
export const errorOnce = (messageOrError: unknown, ...logContent: any[]) =>
    Logger.default.errorOnce(messageOrError, ...logContent);
export const reset = () => Logger.default.reset();
export const logGroup = <T>(name: string, cb: () => T): T => Logger.default.logGroup(name, cb);
