import { ambientLog } from 'ag-charts-core';

declare class Logger {
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

// Flagged: static emitters, which no longer exist on the class.
export function test_ambient_statics() {
    Logger.warn('warn');
    Logger.warnOnce('warn once');
    Logger.error('error');
    Logger.log('log');
}

// Flagged: `ambientLog` outside the sanctioned chart-less files.
export function test_ambient_log() {
    ambientLog.warn('warn');
    ambientLog.warnOnce('warn once');
}

// Allowed: the per-chart scoped logger.
export function test_ctx_logger() {
    ctx.logger.warn('warn');
}

// Allowed: `Logger` used purely as a type.
export function test_type_reference(logger: Logger): Logger {
    return logger;
}
