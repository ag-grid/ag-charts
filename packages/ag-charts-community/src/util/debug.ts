import { toArray } from './array';
import { Logger } from './logger';
import { windowValue } from './window';

type DebugLogger = (...logContent: any[]) => void;

export const Debug = {
    create(...debugSelectors: Array<boolean | string>): DebugLogger {
        return (...logContent: any[]) => {
            if (Debug.check(...debugSelectors)) {
                if (typeof logContent[0] === 'function') {
                    logContent = toArray(logContent[0]());
                }
                Logger.log(...logContent);
            }
        };
    },

    check(...debugSelectors: Array<boolean | string>) {
        if (debugSelectors.length === 0) {
            debugSelectors.push(true);
        }
        const chartDebug: Array<boolean | string> = toArray(windowValue('agChartsDebug'));
        return chartDebug.some((selector) => debugSelectors.includes(selector));
    },
};
