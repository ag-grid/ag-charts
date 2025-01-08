/* eslint-disable no-console */

type Stringifiable = string | number | boolean;

export abstract class Logger {
    private static readonly doOnceCache = new Set<string>();

    static log(...logContent: any[]) {
        console.log(...logContent);
    }

    static warn(message: any, ...logContent: any[]) {
        console.warn(`AG Charts - ${message}`, ...logContent);
    }

    static error(message: any, ...logContent: any[]) {
        if (typeof message === 'object') {
            console.error(`AG Charts error`, message, ...logContent);
        } else {
            console.error(`AG Charts - ${message}`, ...logContent);
        }
    }

    static table(...logContent: any[]) {
        console.table(...logContent);
    }

    static warnOnce(message: Stringifiable, ...logContent: any[]) {
        const cacheKey = `Logger.warn: ${message}`;
        if (this.doOnceCache.has(cacheKey)) return;
        this.warn(message, ...logContent);
        this.doOnceCache.add(cacheKey);
    }

    static errorOnce(message: Stringifiable, ...logContent: any[]) {
        const cacheKey = `Logger.error: ${message}`;
        if (this.doOnceCache.has(cacheKey)) return;
        this.error(message, ...logContent);
        this.doOnceCache.add(cacheKey);
    }

    static reset() {
        this.doOnceCache.clear();
    }
}
