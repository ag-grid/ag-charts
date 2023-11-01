export interface Props {
    isDev: boolean;
    pageName: string;
    exampleName: string;

    modifiedTimeMs: number;
    isExecuting: boolean;
    isEnterprise: boolean;
    entryFileName: string;
    /**
     * Extra script file names (not including entry file)
     */
    scriptFiles?: string[];
    styleFiles?: string[];
    appLocation: string;
    library: Library;
    boilerplatePath: string;

    vueFramework: 'vue' | 'vue3';
}
