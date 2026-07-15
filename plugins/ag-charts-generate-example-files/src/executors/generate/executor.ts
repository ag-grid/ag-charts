/* eslint-disable no-console */
import { deleteFile, writeFile } from 'ag-shared/plugin-utils';
import path from 'path';

import { getGeneratedContents } from './generator/examplesGenerator';
import { FRAMEWORKS } from './generator/types';
import { createFormatCache } from './generator/utils/formatCache';

export type ExecutorOptions = {
    mode: 'dev' | 'prod';
    outputPath: string;
    examplePath: string;
    inputs: string[];
    output: string;
    writeFiles: boolean;
};

export default async function (options: ExecutorOptions) {
    try {
        await generateFiles(options);

        return { success: true, terminalOutput: `Generating example [${options.examplePath}]` };
    } catch (e) {
        return { success: false, terminalOutput: `${e}` };
    }
}

export async function generateFiles(options: ExecutorOptions) {
    const failures: Map<string, [Error, string]> = new Map();

    // Shared for this example only: the same data/topology sources are formatted identically
    // across every dark-mode x framework variant, so memoise to format each once, not once per
    // variant. Scoped to this call and discarded when the example finishes.
    const formatCache = createFormatCache();

    for (const ignoreDarkMode of [false, true]) {
        const darkModePath = ignoreDarkMode ? 'plain' : 'dark-mode';

        for (const internalFramework of FRAMEWORKS) {
            const outputPath = path.join(options.outputPath, darkModePath, internalFramework, 'contents.json');
            const errorsPath = path.join(options.outputPath, darkModePath, internalFramework, 'error.txt');

            let result;
            try {
                result = await getGeneratedContents({
                    folderPath: options.examplePath,
                    internalFramework,
                    ignoreDarkMode,
                    isDev: options.mode === 'dev',
                    formatCache,
                });
                if (!failures.has(internalFramework)) {
                    await deleteFile(errorsPath);
                }
            } catch (error) {
                failures.set(internalFramework, [error, errorsPath]);
                await writeFile(errorsPath, error.stack ?? String(error));
                continue;
            }

            if (options.writeFiles) {
                for (const file of Object.keys(result.files)) {
                    await writeFile(path.join(options.outputPath, internalFramework, file), result.files[file]);
                }
            }
            await writeFile(outputPath, JSON.stringify(result));

            for (const name in result.generatedFiles) {
                if (typeof result.generatedFiles[name] !== 'string') {
                    throw new Error(`${outputPath}: non-string file content`);
                }
            }
        }
    }

    if (failures.size === 1) {
        const [[framework, error]] = failures.entries();
        throw new Error(`Failed to generate FW [${framework}]: `, { cause: error });
    } else if (failures.size > 1) {
        for (const [fw, [_, errorPath]] of failures) {
            console.error(`[${fw}] Failure generating example, error written to [${errorPath}]`);
        }

        throw new Error(`Failed to generate example for FWs: [${[...failures.keys()]}]: `);
    }
}

// For debugging, uncomment below and run this in the root directory:
// node --inspect-brk ./plugins/ag-charts-generate-example-files/dist/src/executors/generate/executor.js
//
// console.log('should generate');
// generateFiles({
//     examplePath: 'packages/ag-charts-website/src/content/docs/layout-test/_examples/layout-matrix',
//     mode: 'dev',
//     inputs: [],
//     output: '',
//     outputPath: 'dist/generated-examples/ag-charts-website/docs/layout-test/_examples/layout-matrix',
//     writeFiles: false,
// }).then(() => console.log('done'));
