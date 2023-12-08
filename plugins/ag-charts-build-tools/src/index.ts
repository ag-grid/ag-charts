import type { CreateDependencies, CreateNodes } from 'nx/src/utils/nx-plugin';

import * as generateExampleFiles from './executors/generate-example-files/create-nodes';

export const createNodes: CreateNodes = [...generateExampleFiles.createNodes];

export const createDependencies: CreateDependencies = async (opts, ctx) => {
    return [...(await generateExampleFiles.createDependencies(opts, ctx))];
};
