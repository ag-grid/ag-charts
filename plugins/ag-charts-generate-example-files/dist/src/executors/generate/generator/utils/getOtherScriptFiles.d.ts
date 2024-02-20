import type { TransformTsFileExt } from '../types';
export declare const getOtherScriptFiles: ({ folderPath, sourceFileList, transformTsFileExt, }: {
    folderPath: string;
    sourceFileList: string[];
    transformTsFileExt?: TransformTsFileExt;
}) => Promise<Record<string, string>>;
