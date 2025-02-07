import type { BatchExecutorTaskResult } from 'ag-shared/plugin-utils';

import { type ExecutorOptions, generateFiles } from './executor';

export type Message = {
    taskName: string;
    options: ExecutorOptions;
};

export default async function processor(msg: Message) {
    const { options, taskName } = msg;

    let result: BatchExecutorTaskResult;
    try {
        await generateFiles(options);
        result = { task: taskName, result: { success: true, terminalOutput: '' } };
    } catch (e) {
        console.error(e);
        result = { task: taskName, result: { success: false, terminalOutput: `${e.stack}` } };
    }

    return result;
}
