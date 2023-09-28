/* eslint-disable no-console */
import type { ExecutorContext } from '@nx/devkit';
import * as fs from 'fs';

import { generate } from './generate-code-reference-files.mjs';
import type { GenerateCodeReferenceFilesExecutorSchema } from './schema';

export default async function runExecutor(options: GenerateCodeReferenceFilesExecutorSchema, context: ExecutorContext) {
    try {
        const outputDir = options.output.split('/').slice(0, -1).join('/');
        fs.mkdirSync(outputDir, { recursive: true });

        generate(options.mode, options.inputs, options.output);

        return { success: true };
    } catch (e) {
        console.log({ options });
        console.error(e);
        return { success: false };
    }
}
