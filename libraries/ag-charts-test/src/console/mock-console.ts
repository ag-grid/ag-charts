/* eslint-disable no-console */

// The intent of setupMockConsole is to suppress console warnings and errors from tests.
// The reason for this is that we have some tests for console messages, (i.e. we have tests
// that pass if a message is printed) and we do not want to pollute the test output with
// messages from passes because it makes it difficult to identify the failures.
//
// But unfortunately suppressing the message also removes the stack-info from the output.
// This makes it more difficult to debug genuine failures. Therefore, we provide an optional
// debug option to disable the message suppression.
export function setupMockConsole(debugShowOutput?: boolean) {
    const originalConsole = {
        warn: console.warn,
        error: console.error,
    };

    beforeEach(() => {
        console.warn = jest.fn().mockImplementation((...args: any[]) => {
            if (debugShowOutput) {
                originalConsole.warn(...args);
            }
        });
        console.error = jest.fn().mockImplementation((...args: any[]) => {
            if (debugShowOutput) {
                originalConsole.error(...args);
            }
        });
    });

    afterEach(() => {
        expect(console.warn).not.toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled();
        (console.warn as jest.Mock).mockClear();
        (console.error as jest.Mock).mockClear();
    });
}

export function expectWarningsCalls() {
    const mockCalls = (console.warn as jest.Mock).mock.calls;
    (console.warn as jest.Mock).mockClear();
    return expect(mockCalls);
}

export function expectWarningMessages(messages: any) {
    try {
        for (let i = 0; i < messages.length; i++) {
            expect(console.warn).toHaveBeenNthCalledWith(i + 1, messages[i]);
        }
        expect(console.warn).toHaveBeenCalledTimes(messages.length);
    } finally {
        (console.warn as jest.Mock).mockClear();
    }
}
