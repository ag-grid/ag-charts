import type { ExecutorContext } from '@nx/devkit';
import type { BatchExecutorTaskResult } from 'ag-shared/plugin-utils';

import { type ExecutorOptions, generateFiles } from './executor';

export type Message = {
    taskName: string;
    options: ExecutorOptions;
    context: Pick<ExecutorContext, 'projectName' | 'targetName' | 'configurationName'>;
    timeout?: number; // Timeout in milliseconds (optional, defaults to 60000)
};

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, taskName: string): Promise<T> {
    let timeoutHandle: NodeJS.Timeout;
    let timeoutFired = false;

    const timeoutPromise = new Promise<T>((_, reject) => {
        timeoutHandle = setTimeout(() => {
            timeoutFired = true;
            if (process.env.DEBUG_TIMEOUT) {
                console.log(`[Worker] Timeout fired for ${taskName} after ${timeoutMs}ms`);
            }
            reject(new Error(`Task '${taskName}' timeout after ${timeoutMs}ms`));
        }, timeoutMs);
    });

    return Promise.race([
        promise.finally(() => {
            // Clear timeout if promise completes first
            if (timeoutHandle) {
                clearTimeout(timeoutHandle);
            }
        }),
        timeoutPromise.then(
            (result) => result,
            async (error) => {
                // If timeout fired, wait for the original promise to complete
                // to avoid leaving the worker in an inconsistent state and prevent
                // overlapping file operations when the worker picks up the next task
                if (timeoutFired) {
                    await promise.catch(() => {
                        // Ignore errors from the original promise after timeout
                    });
                }
                throw error;
            }
        ),
    ]);
}

export default async function processor(msg: Message) {
    const { options, context, taskName, timeout = 60000 } = msg;

    let result: BatchExecutorTaskResult;
    try {
        await withTimeout(generateFiles(options, context), timeout, taskName);
        result = { task: taskName, result: { success: true, terminalOutput: '' } };
    } catch (e) {
        const isTimeout = e instanceof Error && e.message.includes('timeout');
        const terminalOutput = isTimeout ? e.message : `${e}`;
        result = { task: taskName, result: { success: false, terminalOutput } };
    }

    return result;
}
