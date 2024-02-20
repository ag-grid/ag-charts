import type { ExecutorContext } from '@nx/devkit';
import type { BatchExecutorTaskResult } from '../../executors-utils';
import { type ExecutorOptions } from './executor';
export type Message = {
    taskName: string;
    options: ExecutorOptions;
    context: ExecutorContext;
};
export default function processor(msg: Message): Promise<BatchExecutorTaskResult>;
