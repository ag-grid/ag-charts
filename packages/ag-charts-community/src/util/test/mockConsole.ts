import * as agChartsTest from 'ag-charts-test';

import { doOnce } from '../../util/function';

export function setupMockConsole(opts?: { debugShowOutput?: boolean }) {
    agChartsTest.setupMockConsole(opts?.debugShowOutput);

    afterEach(() => {
        doOnce.clear();
    });
}

const { expectWarnings, expectWarning, expectWarningMessages, expectWarningsToMatchSnapshots } = agChartsTest;
export { expectWarnings, expectWarning, expectWarningMessages, expectWarningsToMatchSnapshots };
