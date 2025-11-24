import { Logger } from 'ag-charts-core';
import * as agChartsTest from 'ag-charts-test';

// Mock the logger module to intercept bound console calls
jest.mock('ag-charts-core', () => {
    const actual = jest.requireActual('ag-charts-core');
    const originalLogger = actual.Logger;
    
    return {
        ...actual,
        Logger: {
            ...originalLogger,
            log: jest.fn((...args: any[]) => originalLogger.log(...args)),
            warn: jest.fn((...args: any[]) => originalLogger.warn(...args)),
            error: jest.fn((...args: any[]) => originalLogger.error(...args)),
            table: jest.fn((...args: any[]) => originalLogger.table(...args)),
            warnOnce: jest.fn((...args: any[]) => originalLogger.warnOnce(...args)),
            errorOnce: jest.fn((...args: any[]) => originalLogger.errorOnce(...args)),
            reset: jest.fn(() => originalLogger.reset()),
            logGroup: jest.fn((...args: any[]) => originalLogger.logGroup(...args)),
        },
    };
});

export function setupMockConsole(opts?: { debugShowOutput?: boolean; includeAllLevels?: boolean }) {
    agChartsTest.setupMockConsole(opts?.debugShowOutput, { includeAllLevels: opts?.includeAllLevels ?? false });

    afterEach(() => {
        Logger.reset();
        // Clear logger mocks
        (Logger.warn as jest.Mock).mockClear();
        (Logger.error as jest.Mock).mockClear();
        (Logger.warnOnce as jest.Mock).mockClear();
        (Logger.errorOnce as jest.Mock).mockClear();
    });
}

const { expectWarningMessages, expectWarningsCalls, resetMockConsole } = agChartsTest;
export { expectWarningMessages, expectWarningsCalls, resetMockConsole };
