/* eslint-disable no-console */
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
    });
}

export function expectWarnings(callArgs: any[][]) {
    try {
        for (let i = 0; i < callArgs.length; i++) {
            expect(console.warn).nthCalledWith(i + 1, ...callArgs[i]);
        }
        expect(console.warn).toBeCalledTimes(callArgs.length);
    } finally {
        (console.warn as jest.Mock).mockClear();
    }
}

export function expectWarning(...args: any) {
    expectWarnings([[...args]]);
}

export function expectWarningMessages(...messages: any) {
    expectWarnings([...messages].map((message) => [message]));
}

/* eslint-enable no-console */
