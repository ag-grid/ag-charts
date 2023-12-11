import { DependencyType, type RawProjectGraphDependency, validateDependency } from '@nx/devkit';
import type { CreateDependencies } from 'nx/src/utils/nx-plugin';

export function createTask(parentProject: string, srcRelativeInputPath: string) {
    return {
        'generate-example': {
            dependsOn: [{ projects: 'ag-charts-build-tools', target: 'build' }],
            executor: 'ag-charts-build-tools:generate-example-files',
            inputs: ['{projectRoot}/**/*'],
            outputPath: '{options.outputPath}',
            cache: true,
            options: {
                mode: 'dev',
                examplePath: '{projectRoot}',
                outputPath: `dist/generated-examples/${parentProject}/${srcRelativeInputPath}`,
            },
            configurations: {
                production: {
                    mode: 'prod',
                },
            },
        },
    };
}

export const createDependencies: CreateDependencies = (opts, ctx) => {
    const { projects } = ctx;

    const result: ReturnType<CreateDependencies> = [];
    for (const [name, config] of Object.entries(projects)) {
        if (!config.tags?.includes('type:generated-example')) continue;

        const parent = config.tags?.find((t) => t.startsWith('scope:'))?.split(':')[1];
        if (!parent) continue;

        const dependency: RawProjectGraphDependency = {
            source: `${parent}`,
            target: `${name}`,
            type: DependencyType.implicit,
        };
        validateDependency(dependency, ctx);
        result.push(dependency);
    }

    return result;
};
