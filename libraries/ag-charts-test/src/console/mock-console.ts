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
    let errorMock: jest.Mock, warnMock: jest.Mock;
    const { error, warn } = console;

    function createConsoleMock(consoleMethod: Function) {
        return jest.fn().mockImplementation((...args: any[]) => {
            if (debugShowOutput) {
                consoleMethod(...args);
            }
        });
    }

    beforeAll(() => {
        console.error = errorMock = createConsoleMock(error);
        console.warn = warnMock = createConsoleMock(warn);
    });

    afterEach(() => {
        expect(errorMock).not.toHaveBeenCalled();
        expect(warnMock).not.toHaveBeenCalled();
        errorMock.mockClear();
        warnMock.mockClear();
    });

    afterAll(() => {
        console.error = error;
        console.warn = warn;
    });
}

export function expectWarningsCalls() {
    const warnMock = console.warn as jest.Mock;
    const mockCalls = warnMock.mock.calls;
    warnMock.mockClear();
    return expect(mockCalls);
}

export function expectWarningMessages(messages: any) {
    const warnMock = console.warn as jest.Mock;
    for (let i = 0; i < messages.length; i++) {
        expect(warnMock).toHaveBeenNthCalledWith(i + 1, messages[i]);
    }
    expect(warnMock).toHaveBeenCalledTimes(messages.length);
    warnMock.mockClear();
}
