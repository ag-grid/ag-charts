export type ExampleType = 'generated' | 'mixed' | 'typescript' | 'multi';

export interface ExampleSettings {
    enterprise?: boolean;
}

export type FileContents = Record<string, string>;

export interface GeneratedContents {
    files: FileContents;
    entryFileName: string;
    scriptFiles: string[];
    styleFiles: string[];
    isEnterprise: boolean;
    sourceFileList: string[];
}
