import { ambientLog } from 'ag-charts-core';
import { ambientLogger } from 'ag-charts-core';
import { warn as barrelWarn } from 'ag-charts-core';

import * as relativeNamespace from '../logging/logger';
import { warnOnce as relativeWarnOnce } from '../logging/logger';
import type { Logger as LoggerType } from '../logging/logger';

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

// Flagged: every other route to the shared ambient instance.
export function test_ambient_routes() {
    ambientLogger.warnOnce('instance');
    barrelWarn('barrel free function');
    relativeNamespace.warnOnce('relative namespace');
    relativeWarnOnce('relative free function');
}

// Allowed: `Logger` used purely as a type.
export function test_type_reference(logger: Logger): Logger {
    return logger;
}

// Allowed: a type-only import erases at compile time and cannot emit.
export function test_type_only_import(logger: LoggerType): LoggerType {
    return logger;
}
