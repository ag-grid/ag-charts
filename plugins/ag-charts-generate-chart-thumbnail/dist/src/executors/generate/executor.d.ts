import type { ExecutorContext } from '@nx/devkit';
export type ExecutorOptions = {
    outputPath: string;
    generatedExamplePath: string;
};
export default function (options: ExecutorOptions, ctx: ExecutorContext): Promise<{
    success: boolean;
    terminalOutput: string;
} | {
    success: boolean;
    terminalOutput?: undefined;
}>;
export declare function generateFiles(options: ExecutorOptions, ctx: ExecutorContext): Promise<void>;
