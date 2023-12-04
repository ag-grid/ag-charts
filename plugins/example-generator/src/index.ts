import { toProjectName } from 'nx/src/config/workspaces';
import type { CreateNodes } from 'nx/src/utils/nx-plugin';
import { dirname } from 'path';

export const createNodes: CreateNodes = [
    'packages/**/project.json',
    (configFilePath, options, context) => {
        const name = toProjectName(configFilePath);
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
