import type { CreateDependencies, CreateNodes, TargetConfiguration } from '@nx/devkit';
import { readFileSync } from 'fs';
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

        // Check if the main.ts file contains @ag-options-extract annotation
        const mainTsContent = readFileSync(configFilePath, 'utf-8');
        const hasOptionsExtract = mainTsContent.includes('@ag-options-extract');
        const tags = [`scope:${parentProject}`, 'type:generated-example'];
        if (hasOptionsExtract) {
            tags.push('skip-gha-cache');
        }

        const projectRoot = dirname(configFilePath);
        return {
            projects: {
                [projectName]: {
                    root: projectRoot,
                    name: projectName,
                    tags,
                    targets: {
                        ...createGenerateTarget(thumbnails),
                        ...createTypecheckTarget(),
                        ...generateExampleFiles.createTask(parentProject, srcRelativeInputPath, projectRoot),
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
