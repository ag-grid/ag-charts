"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expectWarningMessages = exports.expectWarning = exports.expectWarnings = exports.setupMockConsole = void 0;
/* eslint-disable no-console */
function setupMockConsole() {
    beforeEach(() => {
        console.warn = jest.fn();
        console.error = jest.fn();
    });
    afterEach(() => {
        expect(console.warn).not.toBeCalled();
        expect(console.error).not.toBeCalled();
        console.warn.mockClear();
        console.error.mockClear();
    });
}
exports.setupMockConsole = setupMockConsole;
function expectWarnings(callArgs) {
    try {
        for (let i = 0; i < callArgs.length; i++) {
            expect(console.warn).nthCalledWith(i + 1, ...callArgs[i]);
        }
        expect(console.warn).toBeCalledTimes(callArgs.length);
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