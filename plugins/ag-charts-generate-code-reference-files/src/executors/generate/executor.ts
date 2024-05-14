/* eslint-disable no-console */
import * as ts from 'typescript';

import { patchDocInterfaces } from '../../doc-interfaces/patch-doc-interfaces';
import { TypeMapper } from '../../doc-interfaces/types-utils';
import { writeJSONFile } from '../../executors-utils';

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
    const typeMapper = new TypeMapper(options.inputs);

    switch (options.mode) {
        // flat version of the interfaces file, without resolving
        case 'debug-interfaces':
            return await writeJSONFile(options.output, typeMapper.entries());

        case 'docs-interfaces':
            const resolvedEntries = typeMapper.resolvedEntries();
            const patchedDocInterfaces = patchDocInterfaces(resolvedEntries);
            const docInterfacesObject = Object.fromEntries(patchedDocInterfaces.entries());

            return await writeJSONFile(options.output, docInterfacesObject);

        default:
            throw new Error(`Unsupported mode "${options.mode}"`);
    }
}
