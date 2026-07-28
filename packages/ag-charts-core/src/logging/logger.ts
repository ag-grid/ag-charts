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
}

function isPromise(value: unknown): value is Promise<unknown> {
    return typeof value === 'object' && value !== null && 'then' in value;
}

/**
 * The single Logger for code that genuinely has no chart, and the instance behind the free functions
 * below. Exported so chart-less callers can satisfy a required `Logger` — a required parameter that
 * has to be filled explicitly is a compile error when threading is missed, where an optional one just
 * swallows the message. Sharing one instance also means one `warnOnce` cache across every chart-less
 * caller, so N sparklines on one bad config warn once rather than N times.
 *
 * This is not an escape hatch: `no-unscoped-logger` governs every import of this module, so reaching
 * for it outside the sanctioned files is a lint error.
 */
export const ambientLogger = new Logger();

export const log = (...logContent: any[]) => ambientLogger.log(...logContent);
export const warn = (message: any, ...logContent: any[]) => ambientLogger.warn(message, ...logContent);
export const error = (message: any, ...logContent: any[]) => ambientLogger.error(message, ...logContent);
export const table = (...logContent: any[]) => ambientLogger.table(...logContent);
export const warnOnce = (messageOrError: unknown, ...logContent: any[]) =>
    ambientLogger.warnOnce(messageOrError, ...logContent);
export const errorOnce = (messageOrError: unknown, ...logContent: any[]) =>
    ambientLogger.errorOnce(messageOrError, ...logContent);
export const reset = () => ambientLogger.reset();
export const logGroup = <T>(name: string, cb: () => T): T => ambientLogger.logGroup(name, cb);
