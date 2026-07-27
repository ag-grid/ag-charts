import * as agChartsTest from '_ag-charts-test';
import { afterEach } from 'vitest';

import { ambientLog } from 'ag-charts-core';

export function setupMockConsole(opts?: { debugShowOutput?: boolean; includeAllLevels?: boolean }) {
    agChartsTest.setupMockConsole(opts?.debugShowOutput, { includeAllLevels: opts?.includeAllLevels ?? false });

    afterEach(() => {
        ambientLog.reset();
    });
}

const { expectWarningMessages, expectWarningsCalls, resetMockConsole } = agChartsTest;
export { expectWarningMessages, expectWarningsCalls, resetMockConsole };
