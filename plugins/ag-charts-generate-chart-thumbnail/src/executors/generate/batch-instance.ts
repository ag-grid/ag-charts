import type { ExecutorContext } from '@nx/devkit';

import type { BatchExecutorTaskResult } from '../../executors-utils';
import { type ExecutorOptions, generateFiles } from './executor';

export type Message = {
    taskName: string;
    options: ExecutorOptions;
    context: ExecutorContext;
};

export default async function processor(msg: Message) {
    const { options, context, taskName } = msg;

    let result: BatchExecutorTaskResult;
    try {
        await generateFiles(options, context);
        result = { task: taskName, result: { success: true, terminalOutput: '' } };
    } catch (e) {
        result = { task: taskName, result: { success: false, terminalOutput: `${e}` } };
    }

    return result;
}
