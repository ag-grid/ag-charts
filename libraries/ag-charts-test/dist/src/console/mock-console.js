"use strict";
/* eslint-disable no-console */
Object.defineProperty(exports, "__esModule", { value: true });
exports.expectWarningMessages = exports.expectWarning = exports.expectWarnings = exports.setupMockConsole = void 0;
// The intent of setupMockConsole is to suppress console warnings and errors from tests.
// The reason for this is that we have some tests for console messages, (i.e. we have tests
// that pass if a message is printed) and we do not want to pollute the test output with
// messages from passes because it makes it difficult to identify the failures.
//
// But unfortunately suppressing the message also removes the stack-info from the output.
// This makes it more difficult to debug genuine failures. Therefore, we provide an optional
// debug option to disable the message suppression.
function setupMockConsole(debugShowOutput) {
    const originalConsole = {
        warn: console.warn,
        error: console.error,
    };
    beforeEach(() => {
        console.warn = jest.fn().mockImplementation((...args) => {
            if (debugShowOutput) {
                originalConsole.warn(...args);
            }
        });
        console.error = jest.fn().mockImplementation((...args) => {
            if (debugShowOutput) {
                originalConsole.error(...args);
            }
        });
    });
    afterEach(() => {
        expect(console.warn).not.toHaveBeenCalled();
        expect(console.error).not.toHaveBeenCalled();
        console.warn.mockClear();
        console.error.mockClear();
    });
}
exports.setupMockConsole = setupMockConsole;
function expectWarnings(callArgs) {
    try {
        for (let i = 0; i < callArgs.length; i++) {
            expect(console.warn).toHaveBeenNthCalledWith(i + 1, ...callArgs[i]);
        }
        expect(console.warn).toHaveBeenCalledTimes(callArgs.length);
    }
    finally {
        console.warn.mockClear();
    }
}
exports.expectWarnings = expectWarnings;
function expectWarning(...args) {
    expectWarnings([[...args]]);
}
exports.expectWarning = expectWarning;
function expectWarningMessages(...messages) {
    expectWarnings([...messages].map((message) => [message]));
}
exports.expectWarningMessages = expectWarningMessages;
/* eslint-enable no-console */
//# sourceMappingURL=mock-console.js.map