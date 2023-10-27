/* eslint-disable no-console */
import * as ts from 'typescript';

import { writeFile } from './executors-utils';
import { mapTyping, resolveType } from './types-utils';

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
    const typesMap = mapTyping(options.inputs);
    const typeEntries = Array.from(typesMap.entries()).sort();

    switch (options.mode) {
        // flat version of the interfaces file, without resolving
        case 'debug-interfaces':
            return writeFile(
                options.output,
                typeEntries.map(([_, { node, heritage }]) => ({ ...node, heritage }))
            );

        case 'docs-interfaces':
            return writeFile(options.output, typeEntries.map(([name]) => resolveType(typesMap, name)).filter(Boolean));

        default:
            throw new Error(`Unsupported mode "${options.mode}"`);
    }
}
