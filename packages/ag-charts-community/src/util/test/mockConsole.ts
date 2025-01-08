import { Logger } from 'ag-charts-core';
import * as agChartsTest from 'ag-charts-test';

export function setupMockConsole(opts?: { debugShowOutput?: boolean }) {
    agChartsTest.setupMockConsole(opts?.debugShowOutput);

    afterEach(() => {
        Logger.reset();
    });
}

const { expectWarningMessages, expectWarningsCalls } = agChartsTest;
export { expectWarningMessages, expectWarningsCalls };
