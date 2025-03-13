interface Params {
    pageName: string;
    exampleName: string;
}

export const CONSOLE_LOG_START = '/** CONSOLE LOG START **/';
export const CONSOLE_LOG_END = '/** CONSOLE LOG END **/';

/**
 * Override console log to send the log message to the parent window
 */
export const getConsoleLogSnippet = ({ pageName, exampleName }: Params) =>
    `${CONSOLE_LOG_START}
const originalConsoleLog = console.log;
console.log = (...args) => {
    window.parent.postMessage({
        type: 'console-log',
        pageName: '${pageName}',
        exampleName: '${exampleName}',
        data: args
    });
    originalConsoleLog(...args);
};
${CONSOLE_LOG_END}`;
