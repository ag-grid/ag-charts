import type { ExecutorContext } from '@nx/devkit';

import type { BatchExecutorTaskResult } from '../../executors-utils';
import { type ExecutorOptions, generateFiles } from './executor';

export type Message = {
    taskName: string;
    options: ExecutorOptions;
    context: ExecutorContext;
};

const queue: Message[] = [];

let processorRef: NodeJS.Immediate;
function startProcessing() {
    if (!processorRef) {
        processorRef = setImmediate(processor);
    }
}

async function processor() {
    while (queue.length > 0) {
        const { options, context, taskName } = queue.pop();

        let result: BatchExecutorTaskResult;
        try {
            await generateFiles(options, context);
            result = { task: taskName, result: { success: true, terminalOutput: '' } };
        } catch (e) {
            result = { task: taskName, result: { success: false, terminalOutput: `${e}` } };
        }

        process.send(result);
    }

    processorRef = undefined;
}

process.on('message', (msg: Message) => {
    queue.push(msg);
    startProcessing();
});
