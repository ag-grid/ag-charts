/* eslint-disable no-console */
export function setupMockConsole() {
    const originalConsole = {
        warn: console.warn,
        error: console.error,
    };

    beforeEach(() => {
        console.warn = jest.fn();
        console.error = jest.fn();
    });

    afterEach(() => {
        const handleMock = (key: 'warn' | 'error') => {
            const mock = console[key] as jest.Mock;
            const calls = [...mock.mock.calls];
            mock.mockClear();

            for (let i = 0; i < calls.length; i++) {
                originalConsole[key](...calls[i]);
            }

            expect(calls).toHaveLength(0);
        };

        handleMock('warn');
        handleMock('error');
    });
}

export function expectWarnings(callArgs: any[][]) {
    try {
        for (let i = 0; i < callArgs.length; i++) {
            expect(console.warn).toHaveBeenNthCalledWith(i + 1, ...callArgs[i]);
        }
        expect(console.warn).toHaveBeenCalledTimes(callArgs.length);
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
