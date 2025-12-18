export type ExampleType = 'generated' | 'mixed' | 'typescript' | 'multi';

export type TransformTsFileExt = undefined | '.js' | '.tsx';

export interface ExampleSettings {
    enterprise?: boolean;
}

export type FileContents = Record<string, string>;

// Make sure to update the Nx plugin copy of this interface when making changes.
export interface GeneratedContents {
    files: FileContents;
    entryFileName: string;
    mainFileName: string;
    scriptFiles: string[];
    styleFiles: string[];
    htmlFiles: string[];
    isEnterprise: boolean;
    hasLocale: boolean;
    hasExampleConsoleLog: boolean;
    hasBenchmarkConfig: boolean;
    sourceFileList: string[];
    boilerPlateFiles: FileContents;
    providedExamples: FileContents;
    generatedFiles: FileContents;
    packageJson: Record<string, any>;
}

// Make sure to update the Nx plugin copy of this interface when making changes.
export interface ExampleSubstitutions {
    '${baseWWWUrl}': string;
}

export type InternalFramework = 'vanilla' | 'typescript' | 'reactFunctional' | 'reactFunctionalTs' | 'angular' | 'vue3';

export const TYPESCRIPT_INTERNAL_FRAMEWORKS: InternalFramework[] = ['typescript', 'reactFunctionalTs', 'angular'];

export const isGeneratedExample = (type: ExampleType) => ['generated', 'mixed', 'typescript'].includes(type);
