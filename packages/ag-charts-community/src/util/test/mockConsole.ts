import { Logger } from 'ag-charts-core';
import * as agChartsTest from 'ag-charts-test';

export function setupMockConsole(opts?: { debugShowOutput?: boolean; includeAllLevels?: boolean }) {
    agChartsTest.setupMockConsole(opts?.debugShowOutput, { includeAllLevels: opts?.includeAllLevels ?? false });

    afterEach(() => {
        Logger.reset();
    });
}

const { expectWarningMessages, expectWarningsCalls, resetMockConsole } = agChartsTest;
export { expectWarningMessages, expectWarningsCalls, resetMockConsole };
