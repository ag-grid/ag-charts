import { Logger, ambientLog } from 'ag-charts-core';

/**
 * The Logger for unit tests that construct chart internals directly rather than through a chart.
 * Shared so `warnOnce` dedups across the collaborators of a single test.
 */
export const testLogger = new Logger();

/** Clear every `warnOnce` dedup cache a test could have populated. */
export function resetTestLogging() {
    testLogger.reset();
    ambientLog.reset();
}
