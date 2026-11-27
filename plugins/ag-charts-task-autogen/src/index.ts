import { createNodesFromFiles } from '@nx/devkit';
import type { CreateDependencies, CreateNodes, CreateNodesResult, TargetConfiguration } from '@nx/devkit';
import { readFileSync } from 'fs';
import { dirname } from 'path';
import { isDeepStrictEqual } from 'util';

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
    (configFilePaths, options, context) => createNodesFromFiles(createExampleNodes, configFilePaths, options, context),
];

function createExampleNodes(configFilePath: string): CreateNodesResult {
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

    // Check if the main.ts file contains @ag-options-extract annotation
    const mainTsContent = readFileSync(configFilePath, 'utf-8');
    const hasOptionsExtract = mainTsContent.includes('@ag-options-extract');
    const tags = [`scope:${parentProject}`, 'type:generated-example'];
    if (hasOptionsExtract) {
        tags.push('skip-gha-cache');
    }

    const projectRoot = dirname(configFilePath);
    const generateTargets: Record<string, TargetConfiguration> = {
        ...generateExampleFiles.createTask(parentProject, srcRelativeInputPath, projectRoot),
        ...(thumbnails ? generateChartThumbnails.createTask(parentProject, srcRelativeInputPath) : {}),
    };
    return {
        projects: {
            [projectName]: {
                root: projectRoot,
                name: projectName,
                tags,
                targets: {
                    ...createGenerateTarget(generateTargets),
                    ...createTypecheckTarget(),
                    ...generateTargets,
                },
            },
        },
    };
}

export const createDependencies: CreateDependencies = async (opts, ctx) => {
    return [...(await generateExampleFiles.createDependencies(opts, ctx))];
};

// Takes the inputs of the tasks it runs: `nx affected` selects a task by its own inputs, so an
// aggregator with none would never be selected, and neither would the tasks under it.
function createGenerateTarget(generateTargets: Record<string, TargetConfiguration>): {
    [targetName: string]: TargetConfiguration<any>;
} {
    const inputs = Object.values(generateTargets).flatMap((target) => target.inputs ?? []);
    return {
        generate: {
            executor: 'nx:noop',
            dependsOn: Object.keys(generateTargets),
            inputs: inputs.filter((input, index) => inputs.findIndex((i) => isDeepStrictEqual(i, input)) === index),
            outputs: [],
            cache: true,
        },
    };
}

function createTypecheckTarget(): { [targetName: string]: TargetConfiguration<any> } {
    return {
        typecheck: {
            executor: 'nx:run-commands',
            dependsOn: [
                'ag-charts-community:build:types',
                'ag-charts-enterprise:build:types',
                'ag-charts-types:build:types',
            ],
            inputs: [
                '{workspaceRoot}/packages/ag-charts-website/tsconfig.examples.json',
                '{projectRoot}/*.ts',
                'tsDeclarations',
            ],
            outputs: [],
            cache: true,
            options: {
                parallel: false,
                commands: [
                    'echo \'{ "extends": "../../../../../../tsconfig.examples.json", "include": ["**/*.ts"] }\' > {projectRoot}/tsconfig.example.json',
                    'yarn tsc --noEmit -p {projectRoot}/tsconfig.example.json',
                    'rm {projectRoot}/tsconfig.example.json',
                ],
            },
        },
    };
}
