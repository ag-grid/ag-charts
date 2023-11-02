export type ExampleType = 'generated' | 'mixed' | 'typescript' | 'multi';

export type TransformTsFileExt = undefined | '.js' | '.tsx';

export interface ExampleSettings {
    enterprise?: boolean;
}

export type FileContents = Record<string, string>;

export interface GeneratedContents {
    files: FileContents;
    entryFileName: string;
    mainFileName: string;
    scriptFiles: string[];
    styleFiles: string[];
    isEnterprise: boolean;
    sourceFileList: string[];
    boilerPlateFiles: FileContents;
}
