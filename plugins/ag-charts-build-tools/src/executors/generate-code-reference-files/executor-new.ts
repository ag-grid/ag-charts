/* eslint-disable no-console */
import * as ts from 'typescript';

import { writeFile } from './executors-utils';
import { TypeMapper } from './types-utils';

type OptionsMode = 'debug-interfaces' | 'docs-interfaces';
type ExecutorOptions = { mode: OptionsMode; inputs: string[]; output: string };

export default async function (options: ExecutorOptions) {
    try {
        console.log('-'.repeat(80));
        console.log('Generate docs reference files...');
        console.log('Using Typescript version: ', ts.version);

        generateFile(options);

        console.log('Generation completed.');
        console.log('-'.repeat(80));

        return { success: true };
    } catch (e) {
        console.error(e, { options });
        return { success: false };
    }
}

function generateFile(options: ExecutorOptions) {
    const typeMapper = new TypeMapper(options.inputs);

    switch (options.mode) {
        // flat version of the interfaces file, without resolving
        case 'debug-interfaces':
            return writeFile(options.output, typeMapper.entries());

        case 'docs-interfaces':
            return writeFile(options.output, typeMapper.resolvedEntries());

        default:
            throw new Error(`Unsupported mode "${options.mode}"`);
    }
}
