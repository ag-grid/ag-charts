import type { ExecutorContext, TaskGraph } from '@nx/devkit';
import * as fs from 'fs';
import * as glob from 'glob';
import * as path from 'path';
import * as ts from 'typescript';

export type TaskResult = {
    success: boolean;
    terminalOutput: string;
    startTime?: number;
    endTime?: number;
};

export type BatchExecutorTaskResult = {
    task: string;
    result: TaskResult;
};

export function readJSONFile(filePath: string) {
    return fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf-8')) : null;
}

export function readFile(filePath: string) {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : null;
}

export function writeJSONFile(filePath: string, data: unknown, indent = 2) {
    const dataContent = JSON.stringify(data, null, indent);
    writeFile(filePath, dataContent);
}

export function writeFile(filePath: string, newContent: string | Buffer) {
    if (typeof newContent === 'string') {
        const fileContent = readFile(filePath)?.toString();

        // Only write if content changed to avoid false-positive change detection.
        if (fileContent === newContent) return;
    }

    const outputDir = path.dirname(filePath);
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(filePath, newContent);
}

export function parseFile(filePath: string) {
    return ts.createSourceFile('tempFile.ts', fs.readFileSync(filePath, 'utf8'), ts.ScriptTarget.Latest, true);
}

export function inputGlob(fullPath: string) {
    return glob.sync(`${fullPath}/**/*.ts`, {
        ignore: [`${fullPath}/**/*.test.ts`, `${fullPath}/**/*.spec.ts`],
    });
}

export function batchExecutor<ExecutorOptions>(
    executor: (opts: ExecutorOptions, ctx: ExecutorContext) => Promise<void>
) {
    return async function* (
        _taskGraph: TaskGraph,
        inputs: Record<string, ExecutorOptions>,
        overrides: ExecutorOptions,
        context: ExecutorContext
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
                            await executor({ ...inputOptions, ...overrides }, context);
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
    };
}
