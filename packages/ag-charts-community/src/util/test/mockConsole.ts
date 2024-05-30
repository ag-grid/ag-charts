import * as agChartsTest from 'ag-charts-test';

import { doOnce } from '../../util/function';

export function setupMockConsole(opts?: { debugShowOutput?: boolean }) {
    agChartsTest.setupMockConsole(opts?.debugShowOutput);

    afterEach(() => {
        doOnce.clear();
    });
}

const { expectWarningMessages, expectWarningsCalls } = agChartsTest;
export { expectWarningMessages, expectWarningsCalls };
