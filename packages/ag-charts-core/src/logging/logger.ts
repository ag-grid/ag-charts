/* eslint-disable no-console */
import { EventEmitter } from '../structures/eventEmitter';

export const LOG_LEVELS = ['error', 'warning', 'deprecation'] as const;

/** The console severities a Logger can emit, each selected independently of the others. */
export type LogLevel = (typeof LOG_LEVELS)[number];

/** Derived from the level tuple, so a new level cannot be missed here. */
export function isLogLevel(value: unknown): value is LogLevel {
    return typeof value === 'string' && (LOG_LEVELS as readonly string[]).includes(value);
}

/**
 * One console emission, as reported to {@link Logger.onIssue} subscribers. The severity is the console
 * channel the message went to, so nothing downstream can classify a problem differently from the console.
 */
export interface LogIssue {
    severity: LogLevel;
    /** The console text after the `AG Charts - ` prefix; an Error's own message when one was logged. */
    message: string;
    /** A logged Error's stack, then any further console arguments, one per line. */
    detail?: string;
    /** A logged Error, so a subscriber that throws can chain it. */
    cause?: unknown;
}

// A logged value can be anything a user callback threw, so serialisation must not be the thing that throws.
function stringifyLogContent(value: unknown): string {
    if (value instanceof Error || typeof value !== 'object' || value == null) return String(value);
    const customToString = typeof value.toString === 'function' && value.toString !== Object.prototype.toString;
    try {
        return customToString ? String(value) : JSON.stringify(value);
    } catch {
        return '[object Object]';
    }
}

interface LogGroup {
    name: string;
    opened: boolean;
}

export class Logger {
    private readonly doOnceCache = new Set<string>();
    private readonly onceIssues = new Map<string, LogIssue>();

    // Groups this logger is inside, outermost first. An entry is only `opened` on the console once a
    // message has actually been emitted within it.
    private readonly groups: LogGroup[] = [];

    // OPTIMIZATION: one flag per level rather than a Set or a per-call `includes`, since `error()`,
    // `warn()` and `deprecation()` are called from option-application paths.
    private errorEnabled = true;
    private warningEnabled = true;
    private deprecationEnabled = true;

    private readonly issues = new EventEmitter<{ issue: LogIssue }>();

    /**
     * Subscribes to every `error`, `warn` and `deprecation` call, whether or not the console showed it:
     * `setEnabledLevels` and the `*Once` caches gate the console only. A subscriber may throw, and the
     * throw unwinds out of the logging call itself.
     */
    onIssue(listener: (issue: LogIssue) => void) {
        return this.issues.on('issue', listener);
    }

    /** Replaces the enabled severities on a live Logger, which the chart's options lifecycle drives. */
    setEnabledLevels(levels: readonly LogLevel[]) {
        this.errorEnabled = levels.includes('error');
        this.warningEnabled = levels.includes('warning');
        this.deprecationEnabled = levels.includes('deprecation');
    }

    log(...logContent: any[]) {
        this.openGroups();
        console.log(...logContent);
    }

    /**
     * Deprecation notices. Emitted on the same console channel as `warn`, but a tier of its own that
     * is enabled and disabled independently of it.
     */
    deprecation(message: any, ...logContent: any[]) {
        if (this.deprecationEnabled) {
            this.openGroups();
            console.warn(`AG Charts - ${message}`, ...logContent);
        }
        this.emitIssue('deprecation', message, logContent);
    }

    warn(message: any, ...logContent: any[]) {
        if (this.warningEnabled) {
            this.openGroups();
            console.warn(`AG Charts - ${message}`, ...logContent);
        }
        this.emitIssue('warning', message, logContent);
    }

    error(message: any, ...logContent: any[]) {
        if (this.errorEnabled) {
            this.openGroups();
            if (typeof message === 'object') {
                console.error(`AG Charts error`, message, ...logContent);
            } else {
                console.error(`AG Charts - ${message}`, ...logContent);
            }
        }
        this.emitIssue('error', message, logContent);
    }

    // Console first, then subscribers: a subscriber that throws must not lose the console record.
    private emitIssue(severity: LogLevel, message: unknown, logContent: unknown[], cacheKey?: string) {
        if (!this.issues.hasListeners('issue')) return;
        const memoised = cacheKey == null ? undefined : this.onceIssues.get(cacheKey);
        if (memoised) {
            this.issues.emit('issue', memoised);
            return;
        }
        const details = logContent.map(stringifyLogContent);
        const issue: LogIssue =
            message instanceof Error
                ? { severity, message: message.message, cause: message }
                : { severity, message: stringifyLogContent(message) };
        if (message instanceof Error && message.stack) details.unshift(message.stack);
        const detail = details.filter((part) => part !== '').join('\n');
        if (detail !== '') issue.detail = detail;
        if (cacheKey != null) this.onceIssues.set(cacheKey, issue);
        this.issues.emit('issue', issue);
    }

    table(...logContent: any[]) {
        this.openGroups();
        console.table(...logContent);
    }

    private guardOnce<T>(messageOrError: T, severity: LogLevel, logContent: unknown[], cb: (message: T) => void) {
        let message: string;
        if (messageOrError instanceof Error) {
            message = messageOrError.message;
        } else if (typeof messageOrError === 'string') {
            message = messageOrError;
        } else if (typeof messageOrError === 'object') {
            message = stringifyLogContent(messageOrError);
        } else {
            message = String(messageOrError);
        }
        const cacheKey = `${severity}: ${message}`;
        // A repeat is emitted with the first call's issue: `handleInvalidValue` reaches here once per invalid datum.
        if (this.doOnceCache.has(cacheKey)) {
            this.emitIssue(severity, messageOrError, logContent, cacheKey);
            return;
        }
        // Only remember a message the severity gate lets through: the enabled levels are mutable, so
        // caching a suppressed message would swallow it permanently once it is enabled.
        if (this.isEnabled(severity)) {
            this.doOnceCache.add(cacheKey);
        }
        cb(messageOrError);
    }

    private isEnabled(severity: LogLevel) {
        if (severity === 'error') return this.errorEnabled;
        if (severity === 'warning') return this.warningEnabled;
        return this.deprecationEnabled;
    }

    deprecationOnce(messageOrError: unknown, ...logContent: any[]) {
        this.guardOnce(messageOrError, 'deprecation', logContent, (message) =>
            this.deprecation(message, ...logContent)
        );
    }

    warnOnce(messageOrError: unknown, ...logContent: any[]) {
        this.guardOnce(messageOrError, 'warning', logContent, (message) => this.warn(message, ...logContent));
    }

    errorOnce(messageOrError: unknown, ...logContent: any[]) {
        this.guardOnce(messageOrError, 'error', logContent, (message) => this.error(message, ...logContent));
    }

    reset() {
        this.doOnceCache.clear();
        this.onceIssues.clear();
    }

    destroy() {
        this.reset();
        this.issues.clear();
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
