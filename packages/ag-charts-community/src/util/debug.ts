import { toArray } from './array';
import { Logger } from './logger';
import { windowValue } from './window';

type ConsoleFunction = (...logContent: any[]) => void;
type DebugLogger = ConsoleFunction & { table: ConsoleFunction };

export const Debug = {
    create(...debugSelectors: Array<boolean | string>): DebugLogger {
        function debugLogger(...logContent: any[]) {
            if (Debug.check(...debugSelectors)) {
                Logger.log(...logContent);
            }
        }

        debugLogger.table = (...logContent: any[]) => {
            if (Debug.check(...debugSelectors)) {
                // eslint-disable-next-line no-console
                console.table(...logContent);
            }
        };

        return debugLogger;
    },

    check(...debugSelectors: Array<boolean | string>) {
        if (debugSelectors.length === 0) {
            debugSelectors.push(true);
        }
        const chartDebug: Array<boolean | string> = toArray(windowValue('agChartsDebug'));
        return chartDebug.some((selector) => debugSelectors.includes(selector));
    },
};
