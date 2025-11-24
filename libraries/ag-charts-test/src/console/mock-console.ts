const ERROR_METHODS: (keyof typeof console)[] = ['warn', 'error'];
const NORMAL_METHODS: (keyof typeof console)[] = ['trace', 'debug', 'info', 'log'];
const ALL_METHODS = [...NORMAL_METHODS, ...ERROR_METHODS];

// The intent of setupMockConsole is to suppress console warnings and errors from tests.
// The reason for this is that we have some tests for console messages, (i.e. we have tests
// that pass if a message is printed) and we do not want to pollute the test output with
// messages from passes because it makes it difficult to identify the failures.
//
// But unfortunately suppressing the message also removes the stack-info from the output.
// This makes it more difficult to debug genuine failures. Therefore, we provide an optional
// debug option to disable the message suppression.
export function setupMockConsole(debugShowOutput?: boolean, { includeAllLevels = false } = {}) {
    const mocks = new Map<string, [jest.Mock, Function]>();
    const loggerSpies = new Map<string, jest.SpyInstance>();
    const consoleMethods = [...ERROR_METHODS];
    if (includeAllLevels) {
        consoleMethods.push(...NORMAL_METHODS);
    }

    function createConsoleMock(consoleMethod: Function) {
        return jest.fn().mockImplementation((...args: any[]) => {
            if (debugShowOutput) {
                consoleMethod(...args);
            }
        });
    }

    beforeAll(() => {
        // Mock console methods first
        for (const method of consoleMethods) {
            const fn = console[method];
            const mock = createConsoleMock(console[method]);
            console[method] = mock;
            mocks.set(method, [mock, fn]);
        }

        // Spy on logger exports - they use bound console methods, so we need to spy on them
        // and make them delegate to the console mocks
        // Use dynamic require to avoid circular dependency issues at build time
        try {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const loggerModule = require('ag-charts-core/src/globals/logger');
            const loggerMethods = ['warn', 'error', 'warnOnce', 'errorOnce'] as const;
            
            for (const method of loggerMethods) {
                if (loggerModule[method]) {
                    const targetConsoleMethod = method === 'warnOnce' ? 'warn' : method === 'errorOnce' ? 'error' : method;
                    const consoleMock = mocks.get(targetConsoleMethod)?.[0];
                    if (consoleMock) {
                        const spy = jest.spyOn(loggerModule, method).mockImplementation((...args: any[]) => {
                            // Delegate to the console mock
                            // The bound functions prepend 'AG Charts - ' as the first arg, so we pass all args
                            return consoleMock(...args);
                        });
                        loggerSpies.set(method, spy);
                    }
                }
            }
        } catch (e) {
            // Logger module might not be available in all test contexts, ignore silently
            // This can happen if ag-charts-core is not a dependency of the test package
        }
    });

    afterEach(() => {
        try {
            // Check both console mocks and logger spies for errors
            for (const method of ERROR_METHODS) {
                expect(mocks.get(method)?.[0]).not.toHaveBeenCalled();
            }
            const warnSpy = loggerSpies.get('warn');
            const errorSpy = loggerSpies.get('error');
            if (warnSpy) expect(warnSpy).not.toHaveBeenCalled();
            if (errorSpy) expect(errorSpy).not.toHaveBeenCalled();
        } finally {
            for (const method of consoleMethods) {
                mocks.get(method)?.[0].mockClear();
            }
            for (const spy of loggerSpies.values()) {
                spy.mockClear();
            }
        }
    });

    afterAll(() => {
        // Restore logger spies
        for (const spy of loggerSpies.values()) {
            spy.mockRestore();
        }
        // Restore console methods
        for (const method of consoleMethods) {
            console[method] = mocks.get(method)?.[1] as any;
        }
    });
}

export function resetMockConsole() {
    for (const method of ALL_METHODS) {
        const methodFn = console[method];
        if (jest.isMockFunction(methodFn)) {
            methodFn.mockClear();
        }
    }
}

export function expectWarningsCalls() {
    // Logger spies delegate to console mocks, so we can read from console.warn mock
    const warnMock = console.warn as jest.Mock;
    const mockCalls = warnMock.mock.calls;
    warnMock.mockClear();
    return expect(mockCalls);
}

export function expectWarningMessages(messages: any) {
    // Logger spies delegate to console mocks, so we can read from console.warn mock
    const warnMock = console.warn as jest.Mock;
    try {
        for (let i = 0; i < messages.length; i++) {
            expect(warnMock).toHaveBeenNthCalledWith(i + 1, messages[i]);
        }
        expect(warnMock).toHaveBeenCalledTimes(messages.length);
    } finally {
        warnMock.mockClear();
    }
}
