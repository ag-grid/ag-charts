declare class Logger {
    static default: Logger;
    static warn(message: string): void;
    static warnOnce(message: string): void;
    static error(message: string): void;
    static log(message: string): void;
    warn(message: string): void;
    warnOnce(message: string): void;
    constructor(minSeverity?: number);
}

declare const ctx: { logger: Logger };

// Flagged: ambient unscoped construction.
export const unscoped = new Logger();

// Flagged: ambient static emitters.
export function test_ambient_statics() {
    Logger.warn('warn');
    Logger.warnOnce('warn once');
    Logger.error('error');
    Logger.log('log');
}

// Allowed: the explicit shared fallback for chart-less code.
export function test_default_fallback() {
    Logger.default.warn('warn');
    Logger.default.warnOnce('warn once');
}

// Allowed: the per-chart scoped logger.
export function test_ctx_logger() {
    ctx.logger.warn('warn');
}

// Allowed: `Logger` used purely as a type.
export function test_type_reference(logger: Logger): Logger {
    return logger;
}
