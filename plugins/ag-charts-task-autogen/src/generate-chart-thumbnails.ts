export function createTask(parentProject: string, srcRelativeInputPath: string) {
    const generatedExamplePath = `dist/generated-examples/${parentProject}/${srcRelativeInputPath}`;

    return {
        'generate-thumbnail': {
            dependsOn: [
                'generate-example',
                'ag-charts-generate-chart-thumbnail:build',
                'ag-charts-community:build',
                'ag-charts-enterprise:build',
            ],
            inputs: [
                '{projectRoot}/**',
                '{workspaceRoot}/plugins/ag-charts-generate-chart-thumbnail/dist/**/*',
                '{workspaceRoot}/packages/ag-charts-core/dist/package/*.cjs.js',
                '{workspaceRoot}/packages/ag-charts-community/dist/package/*.cjs.js',
                '{workspaceRoot}/packages/ag-charts-enterprise/dist/package/*.cjs.js',
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
                archive: {},
                staging: {},
                production: {},
            },
        },
    };
}
