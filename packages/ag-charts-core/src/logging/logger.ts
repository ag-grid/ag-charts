/* eslint-disable no-console */

// Minimum console severity a Logger emits (higher = quieter); the default of 0 admits every message.
const SEVERITY = { deprecation: 1, warn: 2, error: 3 } as const;

/** The public `validations.consoleLogSeverity` scale, as an inclusive threshold. */
export type LogLevel = 'deprecation' | 'warning' | 'error' | 'none';

const LEVEL_SEVERITY: Record<LogLevel, number> = {
    // The loudest level admits everything, so it is exactly the ungated default rather than a floor.
    deprecation: 0,
    warning: SEVERITY.warn,
    error: SEVERITY.error,
    none: SEVERITY.error + 1,
};

/** Derived from the severity table, so a new level cannot be missed here. */
export function isLogLevel(value: unknown): value is LogLevel {
    return typeof value === 'string' && Object.hasOwn(LEVEL_SEVERITY, value);
}

interface LogGroup {
    name: string;
    opened: boolean;
}

export class Logger {
    private readonly doOnceCache = new Set<string>();

    // Groups this logger is inside, outermost first. An entry is only `opened` on the console once a
    // message has actually been emitted within it.
    private readonly groups: LogGroup[] = [];

    constructor(private minSeverity: number = 0) {}

    /** Raises or lowers the threshold on a live Logger, which the chart's options lifecycle drives. */
    setLevel(level: LogLevel) {
        this.minSeverity = LEVEL_SEVERITY[level];
    }

    log(...logContent: any[]) {
        this.openGroups();
        console.log(...logContent);
    }

    /**
     * The quietest tier — deprecation notices, which `'warning'` and above suppress. Emitted on the
     * same console channel as `warn`.
     *
     * Returns whether the message was emitted, so `guardOnce` can avoid caching a suppressed message.
     */
    deprecation(message: any, ...logContent: any[]) {
        if (this.minSeverity > SEVERITY.deprecation) return false;
        this.openGroups();
        console.warn(`AG Charts - ${message}`, ...logContent);
        return true;
    }

    warn(message: any, ...logContent: any[]) {
        if (this.minSeverity > SEVERITY.warn) return false;
        this.openGroups();
        console.warn(`AG Charts - ${message}`, ...logContent);
        return true;
    }

    error(message: any, ...logContent: any[]) {
        if (this.minSeverity > SEVERITY.error) return false;
        this.openGroups();
        if (typeof message === 'object') {
            console.error(`AG Charts error`, message, ...logContent);
        } else {
            console.error(`AG Charts - ${message}`, ...logContent);
        }
        return true;
    }

    table(...logContent: any[]) {
        this.openGroups();
        console.table(...logContent);
    }

    private guardOnce<T>(messageOrError: T, prefix: string, cb: (message: T) => boolean) {
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
        // Only remember a message the severity gate actually let through: the level is mutable, so
        // caching a suppressed message would swallow it permanently once the level is lowered.
        if (cb(messageOrError)) {
            this.doOnceCache.add(cacheKey);
        }
    }

    deprecationOnce(messageOrError: unknown, ...logContent: any[]) {
        this.guardOnce(messageOrError, 'Logger.deprecation', (message) => this.deprecation(message, ...logContent));
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
        const group: LogGroup = { name, opened: false };
        this.groups.push(group);
        let syncCleanup = true;
        try {
            const result = cb();
            if (isPromise(result)) {
                syncCleanup = false;
                return result.finally(() => {
                    this.closeGroup(group);
                }) as T;
            }
            return result;
        } finally {
            if (syncCleanup) {
                this.closeGroup(group);
            }
        }
    }

    /**
     * Opens the enclosing groups on the console, outermost first. Deferred to the first emission so a
     * group that logs nothing leaves the console's grouping state untouched.
     */
    private openGroups() {
        for (const group of this.groups) {
            if (!group.opened) {
                group.opened = true;
                console.groupCollapsed(group.name);
            }
        }
    }

    private closeGroup(group: LogGroup) {
        const index = this.groups.lastIndexOf(group);
        if (index === -1) return;

        // Console grouping is a stack and concurrent async groups can close out of order, so closing this
        // group must also close everything opened inside it. Their own close is then a no-op.
        for (let i = this.groups.length - 1; i >= index; i--) {
            if (this.groups[i].opened) {
                console.groupEnd();
            }
        }
        this.groups.length = index;
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
