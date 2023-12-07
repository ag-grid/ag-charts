import { DependencyType, type RawProjectGraphDependency, validateDependency } from '@nx/devkit';
import { toProjectName } from 'nx/src/config/workspaces';
import type { CreateDependencies, CreateNodes } from 'nx/src/utils/nx-plugin';
import { dirname } from 'path';

const PROJECTS = ['ag-charts-website'];
const NON_UNIQUE_PATH_ELEMENTS = ['src', 'content', 'docs', '_examples'];
const NON_UNIQUE_PATH_ELEMENTS_MAP = NON_UNIQUE_PATH_ELEMENTS.reduce((r, n) => {
    r[n] = true;
    return r;
}, {});

export const createNodes: CreateNodes = [
    'packages/*/src/**/_examples/*/main.ts',
    (configFilePath, options, context) => {
        const name = toProjectName(configFilePath);
        const parentProject = PROJECTS.find((p) => configFilePath.startsWith(`packages/${p}`));

        if (!parentProject) {
            return {};
        }

        const uniqueName = configFilePath
            .split('/')
            .slice(2)
            .filter((p) => !NON_UNIQUE_PATH_ELEMENTS_MAP[p])
            .join('_');
        const parentPath = `packages/${parentProject}`;
        const examplePath = dirname(configFilePath).replace(`packages/${parentProject}/`, '{projectRoot}/');
        const projectRelativeInputPath = examplePath.split('/').slice(2).join('/');
        const srcRelativeInputPath = projectRelativeInputPath.split('/').slice(1).join('/');

        const projectName = `${parentProject}-${uniqueName}`;
        return {
            projects: {
                [parentProject]: {
                    root: parentPath,
                    targets: {
                        'generate-examples': {
                            executor: 'nx:noop',
                            dependsOn: ['^generate-example'],
                        },
                    },
                },
                [projectName]: {
                    root: dirname(configFilePath),
                    tags: [`scope:${parentProject}`, 'type:generated-example'],
                    targets: {
                        'generate-example': {
                            dependsOn: [{ projects: 'ag-charts-build-tools', target: 'build ' }],
                            executor: 'ag-charts-build-tools:generate-example-files',
                            inputs: ['{projectRoot}/**/*'],
                            outputPath: '{options.output}',
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
                    },
                },
            },
        };
    },
];

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
