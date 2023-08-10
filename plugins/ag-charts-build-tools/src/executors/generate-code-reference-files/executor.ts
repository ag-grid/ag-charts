import * as fs from 'fs';

import type { ExecutorContext } from '@nx/devkit';

import type { GenerateCodeReferenceFilesExecutorSchema } from './schema';
import { generate } from './generate-code-reference-files';

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
