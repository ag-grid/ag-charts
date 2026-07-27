import { Logger } from 'ag-charts-core';

/**
 * The Logger for unit tests that construct chart internals directly rather than through a chart.
 * Shared so `warnOnce` dedups across the collaborators of a single test, and reset between tests
 * by `setupMockConsole`.
 */
export const testLogger = new Logger();
