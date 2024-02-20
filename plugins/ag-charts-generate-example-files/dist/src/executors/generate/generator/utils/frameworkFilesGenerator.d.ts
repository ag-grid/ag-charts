import type { InternalFramework } from '../types';
import type { FileContents } from '../types';
interface FrameworkFiles {
    files: FileContents;
    boilerPlateFiles?: FileContents;
    hasProvidedExamples?: boolean;
    scriptFiles?: string[];
    /**
     * Filename to execute code
     */
    entryFileName: string;
    /**
     * Filename of main code that is run
     */
    mainFileName: string;
}
type ConfigGenerator = ({ entryFile, indexHtml, isEnterprise, bindings, typedBindings, otherScriptFiles, ignoreDarkMode, isDev, }: {
    entryFile: string;
    indexHtml: string;
    isEnterprise: boolean;
    bindings: any;
    typedBindings: any;
    otherScriptFiles: FileContents;
    ignoreDarkMode?: boolean;
    isDev: boolean;
}) => Promise<FrameworkFiles>;
export declare const frameworkFilesGenerator: Record<InternalFramework, ConfigGenerator>;
export {};
