import * as agChartsTest from '_ag-charts-test';
import { afterEach } from 'vitest';

import { Logger } from 'ag-charts-core';

export function setupMockConsole(opts?: { debugShowOutput?: boolean; includeAllLevels?: boolean }) {
    agChartsTest.setupMockConsole(opts?.debugShowOutput, { includeAllLevels: opts?.includeAllLevels ?? false });

    afterEach(() => {
        Logger.default.reset();
    });
}

const { expectWarningMessages, expectWarningsCalls, resetMockConsole } = agChartsTest;
export { expectWarningMessages, expectWarningsCalls, resetMockConsole };
