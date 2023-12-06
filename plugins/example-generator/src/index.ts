import { toProjectName } from 'nx/src/config/workspaces';
import type { CreateNodes } from 'nx/src/utils/nx-plugin';
import { dirname } from 'path';

const EXAMPLE_GENERATION_PROJECTS = ['ag-charts-website'];

export const createNodes: CreateNodes = [
    'packages/**/project.json',
    (configFilePath, options, context) => {
        const name = toProjectName(configFilePath);

        if (!EXAMPLE_GENERATION_PROJECTS.includes(name)) {
            return {};
        }

        return {
            projects: {
                [name]: {
                    name,
                    root: dirname(configFilePath),
                },
            },
        };
    },
];
