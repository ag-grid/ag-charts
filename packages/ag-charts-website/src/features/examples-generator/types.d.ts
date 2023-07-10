export type FileContents = Record<string, string>;

export interface GeneratedContents {
    files: FileContents;
    entryFileName: string;
    scriptFiles: string[];
    styleFiles: string[];
    isEnterprise: boolean;
    sourceFileList: string[];
}
