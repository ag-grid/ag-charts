/// <reference types="node" />
import type { ExecutorContext, TaskGraph } from '@nx/devkit';
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
export declare function readJSONFile(filePath: string): Promise<any>;
export declare function readFile(filePath: string): Promise<string>;
export declare function writeJSONFile(filePath: string, data: unknown, indent?: number): Promise<void>;
export declare function ensureDirectory(dirPath: string): Promise<void>;
export declare function writeFile(filePath: string, newContent: string | Buffer): Promise<void>;
export declare function parseFile(filePath: string): ts.SourceFile;
export declare function inputGlob(fullPath: string): string[];
export declare function batchExecutor<ExecutorOptions>(executor: (opts: ExecutorOptions, ctx: ExecutorContext) => Promise<void>): (taskGraph: TaskGraph, inputs: Record<string, ExecutorOptions>, overrides: ExecutorOptions, context: ExecutorContext) => AsyncGenerator<BatchExecutorTaskResult, any, unknown>;
export declare function batchWorkerExecutor<ExecutorOptions>(workerModule: string): (taskGraph: TaskGraph, inputs: Record<string, ExecutorOptions>, overrides: ExecutorOptions, context: ExecutorContext) => AsyncGenerator<BatchExecutorTaskResult, any, unknown>;
export declare function consolePrefix(prefix: string, cb: () => Promise<void>): Promise<Record<"log" | "debug" | "info" | "warn" | "error", number>>;
