export declare function createTask(parentProject: string, srcRelativeInputPath: string): {
    'generate-thumbnail': {
        dependsOn: string[];
        inputs: (string | {
            dependentTasksOutputFiles: string;
            transitive: boolean;
            env?: undefined;
            externalDependencies?: undefined;
        } | {
            env: string;
            dependentTasksOutputFiles?: undefined;
            transitive?: undefined;
            externalDependencies?: undefined;
        } | {
            externalDependencies: string[];
            dependentTasksOutputFiles?: undefined;
            transitive?: undefined;
            env?: undefined;
        })[];
        executor: string;
        outputPath: string;
        cache: boolean;
        options: {
            mode: string;
            generatedExamplePath: string;
            outputPath: string;
        };
        configurations: {
            staging: {};
            production: {};
        };
    };
};
