/* eslint-disable no-console */
import { inputGlob, writeJSONFile } from 'ag-shared/plugin-utils';
import { readFileSync } from 'fs';
import * as ts from 'typescript';

import { patchDocInterfaces } from '../../doc-interfaces/patch-doc-interfaces';
import { TypeMapper } from '../../doc-interfaces/type-mapper';
import { TypeResolver } from '../../doc-interfaces/type-resolver';

type OptionsMode = 'debug-interfaces' | 'docs-interfaces';
type ExecutorOptions = { mode: OptionsMode; inputs: string[]; output: string };

export default async function (options: ExecutorOptions) {
    try {
        console.log('-'.repeat(80));
        console.log('Generate docs reference files...');
        console.log('Using Typescript version:', ts.version);

        await generateFile(options);

        console.log(`Generation completed - written to ${options.output}.`);
        console.log('-'.repeat(80));

        return { success: true };
    } catch (e) {
        console.error(e, { options });
        return { success: false };
    }
}

async function generateFile(options: ExecutorOptions) {
    const inputFiles = readInputFiles(options.inputs);
    const typeMapper = new TypeMapper(inputFiles);

    switch (options.mode) {
        case 'debug-interfaces':
            // flat version of the interface file, without resolving
            return await writeJSONFile(options.output, typeMapper.toJSON());

        case 'docs-interfaces':
            const typeResolver = new TypeResolver(typeMapper);
            return await writeJSONFile(options.output, patchDocInterfaces(typeResolver).toJSON());

        default:
            throw new Error(`Unsupported mode "${options.mode}"`);
    }
}

function readInputFiles(inputs: string[]): string[] {
    return inputs.flatMap(inputGlob).map((filePath: string) => readFileSync(filePath, 'utf8'));
}
