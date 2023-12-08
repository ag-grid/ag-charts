import type { CreateDependencies, CreateNodes } from 'nx/src/utils/nx-plugin';

import * as generateExampleFiles from './generate-example-files';

export const createNodes: CreateNodes = [...generateExampleFiles.createNodes];

export const createDependencies: CreateDependencies = async (opts, ctx) => {
    return [...(await generateExampleFiles.createDependencies(opts, ctx))];
};
