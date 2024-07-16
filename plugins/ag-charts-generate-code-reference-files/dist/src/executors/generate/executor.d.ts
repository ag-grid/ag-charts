type OptionsMode = 'debug-interfaces' | 'docs-interfaces';
type ExecutorOptions = {
    mode: OptionsMode;
    inputs: string[];
    output: string;
};
export default function (options: ExecutorOptions): Promise<{
    success: boolean;
}>;
export {};
