export function createTask(parentProject: string, srcRelativeInputPath: string) {
    const generatedExamplePath = `dist/generated-examples/${parentProject}/${srcRelativeInputPath}`;

    return {
        'generate-thumbnail': {
            dependsOn: ['generate-example', 'ag-charts-generate-chart-thumbnail:build'],
            inputs: [
                '{projectRoot}/**',
                { dependentTasksOutputFiles: '**/*', transitive: false },
                { env: 'PUBLIC_PACKAGE_VERSION' },
                { externalDependencies: ['npm:typescript', 'npm:canvas'] },
            ],
            executor: 'ag-charts-generate-chart-thumbnail:generate',
            outputPath: '{options.outputPath}',
            cache: true,
            options: {
                mode: 'dev',
                generatedExamplePath,
                outputPath: `dist/generated-thumbnails/${parentProject}/${srcRelativeInputPath}`,
            },
            configurations: {
                staging: {},
                production: {},
            },
        },
    };
}
