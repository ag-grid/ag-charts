import type { GeneratedContents, InternalFramework } from './types';
type FileListParams = {
    internalFramework: InternalFramework;
    folderPath: string;
};
/**
 * Get the file list of the generated contents
 * (without generating the contents)
 */
export declare const getGeneratedContentsFileList: (params: FileListParams) => Promise<string[]>;
type GeneratedContentParams = {
    internalFramework: InternalFramework;
    folderPath: string;
    ignoreDarkMode?: boolean;
    isDev?: boolean;
};
/**
 * Get generated contents for an example
 */
export declare const getGeneratedContents: (params: GeneratedContentParams) => Promise<GeneratedContents | undefined>;
export {};
