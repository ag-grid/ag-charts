export interface GenerateCodeReferenceFilesExecutorSchema {
    mode: 'interfaces' | 'docs';
    inputs: string[];
    output: string;
}
