import * as agChartsTest from 'ag-charts-test';

import { doOnce } from '../../util/function';

export function setupMockConsole() {
    agChartsTest.setupMockConsole();

    afterEach(() => {
        doOnce.clear();
    });
}

const { expectWarnings, expectWarning, expectWarningMessages } = agChartsTest;
export { expectWarnings, expectWarning, expectWarningMessages };
