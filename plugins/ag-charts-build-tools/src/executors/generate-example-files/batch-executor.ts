import type { ExecutorContext, TaskGraph } from '@nx/devkit';

import * as executor from './executor';

type TaskResult = {
    success: boolean;
    terminalOutput: string;
    startTime?: number;
    endTime?: number;
};

type BatchExecutorTaskResult = {
    task: string;
    result: TaskResult;
};

type ExecutorOptions = {
    mode: 'dev' | 'prod';
    outputPath: string;
    examplePath: string;
    inputs: string[];
    output: string;
};

export default async function* (
    _taskGraph: TaskGraph,
    inputs: Record<string, ExecutorOptions>,
    overrides: ExecutorOptions,
    _context: ExecutorContext
): AsyncGenerator<BatchExecutorTaskResult, any, unknown> {
    const tasks = Object.keys(inputs);
    let taskIndex = 0;

    return yield* {
        [Symbol.asyncIterator]() {
            return {
                async next() {
                    if (taskIndex >= tasks.length) {
                        return { value: undefined, done: true };
                    }

                    const task = tasks[taskIndex++];
                    const inputOptions = inputs[task];

                    let success = false;
                    let terminalOutput = '';
                    try {
                        await executor.generateFiles({ ...inputOptions, ...overrides });
                        success = true;
                    } catch (e) {
                        terminalOutput += `${e}`;
                    }

                    return {
                        value: { task, result: { success, terminalOutput } },
                        done: false,
                    };
                },
            };
        },
    };
}
