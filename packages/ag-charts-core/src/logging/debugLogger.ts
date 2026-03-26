import type { StripCallSignature } from '../types/global';
import { toArray } from '../utils/data/arrays';
import { getWindow } from '../utils/dom/globalsProxy';
import { log, logGroup } from './logger';

export interface DebugLogger {
    (...logContent: any[]): void;
    check(): boolean;
    group<T>(name: string, cb: () => T): T;
}

const LongTimePeriodThreshold = 2000;

let timeOfLastLog = Date.now();
function logTimeGap() {
    const timeSinceLastLog = Date.now() - timeOfLastLog;
    if (timeSinceLastLog > LongTimePeriodThreshold) {
        const prettyDuration = (Math.floor(timeSinceLastLog / 100) / 10).toFixed(1);
        log(`**** ${prettyDuration}s since last log message ****`);
    }
    timeOfLastLog = Date.now();
}

export function create(...debugSelectors: Array<boolean | string>): DebugLogger {
    const resultFn = (...logContent: any[]) => {
        if (check(...debugSelectors)) {
            if (typeof logContent[0] === 'function') {
                logContent = toArray(logContent[0]());
            }
            logTimeGap();
            log(...logContent);
        }
    };
    return Object.assign(resultFn, {
        check: () => check(...debugSelectors),
        group: (name, cb) => {
            if (check(...debugSelectors)) {
                return logGroup(name, cb);
            }
            return cb();
        },
    } satisfies StripCallSignature<DebugLogger>);
}

export function check(...debugSelectors: Array<boolean | string>) {
    if (debugSelectors.length === 0) {
        debugSelectors.push(true);
    }
    const chartDebug = toArray(getWindow<boolean | string>('agChartsDebug'));
    return chartDebug.some((selector) => debugSelectors.includes(selector));
}

export function inDevelopmentMode<R>(fn: () => R): R | undefined {
    if (check('dev')) {
        return fn();
    }
}

interface DebugTimingOptions {
    logResult?: boolean;
    logStack?: boolean;
    logArgs?: boolean;
    logData?: (target: any) => any;
}

// time decorator for measuring method execution time
export function Time(name: string, opts: DebugTimingOptions = {}) {
    const { logResult = true, logStack = false, logArgs = false, logData } = opts;
    return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value;
        descriptor.value = function (...args: any[]) {
            const start = performance.now();
            const result = method.apply(this, args);
            const duration = performance.now() - start;
            const logMessage: Record<string, any> = { duration };

            if (logResult) logMessage.result = result;
            if (logArgs) logMessage.args = args;
            if (logStack) logMessage.stack = new Error('Stack trace for timing debug').stack;
            if (logData) logMessage.logData = logData(this);

            log(name, logMessage);

            return result;
        };
    };
}
