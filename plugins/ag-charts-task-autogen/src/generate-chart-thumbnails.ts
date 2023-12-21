export function createTask(parentProject: string, srcRelativeInputPath: string) {
    const generatedExamplePath = `dist/generated-examples/${parentProject}/${srcRelativeInputPath}`;
    const dependsOn = ['generate-example'];

    return {
        'generate-thumbnail': {
            dependsOn,
            inputs: [
                `{workspaceRoot}/${generatedExamplePath}/**`,
                '{projectRoot}/**',
                '{workspaceRoot}/plugins/ag-charts-generate-chart-thumbnail/**',
                { env: 'PUBLIC_PACKAGE_VERSION' },
                { externalDependencies: [] },
            ],
            executor: 'ag-charts-generate-chart-thumbnail:generate',
            outputPath: '{options.outputPath}',
            cache: true,
            options: {
                mode: 'dev',
                generatedExamplePath,
                outputPath: `dist/generated-thumbnails/${parentProject}/${srcRelativeInputPath}`,
            },
        },
    };
}
