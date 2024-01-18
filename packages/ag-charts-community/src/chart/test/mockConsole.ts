/* eslint-disable no-console */
import { expect } from '@jest/globals';

import { clearDoOnceFlags } from '../../util/function';

export function setupMockConsole() {
    beforeEach(() => {
        console.warn = jest.fn();
        console.error = jest.fn();
    });

    afterEach(() => {
        expect(console.warn).not.toBeCalled();
        expect(console.error).not.toBeCalled();
        (console.warn as jest.Mock).mockClear();
        (console.error as jest.Mock).mockClear();
        clearDoOnceFlags();
    });
}

export function expectWarnings(callArgs: any[][]) {
    for (let i = 0; i < callArgs.length; i++) {
        expect(console.warn).nthCalledWith(i + 1, ...callArgs[i]);
    }
    expect(console.warn).toBeCalledTimes(callArgs.length);
    (console.warn as jest.Mock).mockClear();
}

export function expectWarning(...args: any) {
    expectWarnings([[...args]]);
}

/* eslint-enable no-console */
