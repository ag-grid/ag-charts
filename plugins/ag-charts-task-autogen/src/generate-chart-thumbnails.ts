import { DependencyType, type RawProjectGraphDependency, validateDependency } from '@nx/devkit';
import type { CreateDependencies, CreateNodes } from 'nx/src/utils/nx-plugin';

export function createTask(parentProject: string, srcRelativeInputPath: string) {
    const generatedExamplePath = `dist/generated-examples/${parentProject}/${srcRelativeInputPath}`;
    return {
        'generate-thumbnail': {
            dependsOn: ['generate-example', { projects: 'ag-charts-build-tools', target: 'build' }],
            executor: 'ag-charts-build-tools:generate-chart-thumbnail',
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
