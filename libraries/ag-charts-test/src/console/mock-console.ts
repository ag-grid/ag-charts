/* eslint-disable no-console */
export function setupMockConsole() {
    const originalConsole = {
        warn: console.warn,
        error: console.error,
    };

    beforeEach(() => {
        console.warn = jest.fn().mockImplementation((...args: any[]) => {
            originalConsole.warn(...args);
        });
        console.error = jest.fn().mockImplementation((...args: any[]) => {
            originalConsole.error(...args);
        });
    });

    afterEach(() => {
        expect(console.warn).not.toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled();
        (console.warn as jest.Mock).mockClear();
        (console.error as jest.Mock).mockClear();
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
