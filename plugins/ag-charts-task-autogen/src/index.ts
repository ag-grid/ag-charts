import type { CreateDependencies, CreateNodes, TargetConfiguration } from '@nx/devkit';
import { dirname } from 'path';

import * as generateChartThumbnails from './generate-chart-thumbnails';
import * as generateExampleFiles from './generate-example-files';

const PROJECTS = ['ag-charts-website'];
const NON_UNIQUE_PATH_ELEMENTS = new Set(['src', 'content', 'docs', '_examples']);

const IGNORE_THUMBNAILS = [
    // Too large to generate, isn't visible in the gallery either.
    'ag-charts-website-gallery_large-datasets_main.ts',
];

function generateThumbnails(projectName: string) {
    return projectName.indexOf('gallery') >= 0 && !IGNORE_THUMBNAILS.includes(projectName);
}

export const createNodes: CreateNodes = [
    'packages/*/src/**/_examples/*/main.ts',
    (configFilePath, _options, _context) => {
        const parentProject = PROJECTS.find((p) => configFilePath.startsWith(`packages/${p}`));

        if (!parentProject) {
            return {};
        }

        const uniqueName = configFilePath
            .split('/')
            .slice(2)
            .filter((p) => !NON_UNIQUE_PATH_ELEMENTS.has(p))
            .join('_')
            .replace(' ', '-');
        const examplePath = dirname(configFilePath).replace(`packages/${parentProject}/`, '{projectRoot}/');
        const projectRelativeInputPath = examplePath.split('/').slice(2).join('/');
        const srcRelativeInputPath = projectRelativeInputPath.split('/').slice(1).join('/');

        const projectName = `${parentProject}-${uniqueName}`;
        const thumbnails = generateThumbnails(projectName);
        return {
            projects: {
                [projectName]: {
                    root: dirname(configFilePath),
                    name: projectName,
                    tags: [`scope:${parentProject}`, 'type:generated-example'],
                    targets: {
                        ...createGenerateTarget(thumbnails),
                        ...generateExampleFiles.createTask(parentProject, srcRelativeInputPath),
                        ...(thumbnails ? generateChartThumbnails.createTask(parentProject, srcRelativeInputPath) : {}),
                    },
                },
            },
        };
    },
];

export const createDependencies: CreateDependencies = async (opts, ctx) => {
    return [...(await generateExampleFiles.createDependencies(opts, ctx))];
};

function createGenerateTarget(thumbnails: boolean): { [targetName: string]: TargetConfiguration<any> } {
    const dependsOn = ['generate-example'];
    if (thumbnails) {
        dependsOn.push('generate-thumbnail');
    }
    return {
        generate: {
            executor: 'nx:noop',
            dependsOn,
            inputs: [],
            outputs: [],
            cache: true,
        },
    };
}
