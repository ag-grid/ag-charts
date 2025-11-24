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
        for (const method of consoleMethods) {
            const fn = console[method];
            const mock = createConsoleMock(console[method]);
            console[method] = mock;
            mocks.set(method, [mock, fn]);
        }
    });

    afterEach(() => {
        try {
            for (const method of ERROR_METHODS) {
                expect(mocks.get(method)?.[0]).not.toHaveBeenCalled();
            }
        } finally {
            for (const method of consoleMethods) {
                mocks.get(method)?.[0].mockClear();
            }
        }
    });

    afterAll(() => {
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
