import { Logger } from 'ag-charts-core';
import * as agChartsTest from 'ag-charts-test';

export function setupMockConsole(opts?: { debugShowOutput?: boolean; includeAllLevels?: boolean }) {
    agChartsTest.setupMockConsole(opts?.debugShowOutput, { includeAllLevels: opts?.includeAllLevels ?? false });

    const loggerSpies = new Map<string, jest.SpyInstance>();

    beforeAll(() => {
        // Spy on logger exports since they use bound console methods
        // This avoids circular dependency issues since ag-charts-community can import ag-charts-core
        const loggerMethods = ['warn', 'error', 'warnOnce', 'errorOnce'] as const;
        
        for (const method of loggerMethods) {
            if (Logger[method]) {
                const spy = jest.spyOn(Logger, method).mockImplementation((...args: any[]) => {
                    // Delegate to the mocked console (already set up by agChartsTest.setupMockConsole)
                    const targetMethod = method === 'warnOnce' ? 'warn' : method === 'errorOnce' ? 'error' : method;
                    return (console[targetMethod] as any)(...args);
                });
                loggerSpies.set(method, spy);
            }
        }
    });

    afterEach(() => {
        Logger.reset();
        for (const spy of loggerSpies.values()) {
            spy.mockClear();
        }
    });

    afterAll(() => {
        for (const spy of loggerSpies.values()) {
            spy.mockRestore();
        }
    });
}

const { expectWarningMessages, expectWarningsCalls, resetMockConsole } = agChartsTest;
export { expectWarningMessages, expectWarningsCalls, resetMockConsole };
