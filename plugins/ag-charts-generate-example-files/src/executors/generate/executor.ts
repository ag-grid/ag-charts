/* eslint-disable no-console */
import path from 'path';

import { deleteFile, writeFile } from '../../executors-utils';
import { getGeneratedContents } from './generator/examplesGenerator';
import { FRAMEWORKS } from './generator/types';

export type ExecutorOptions = {
    mode: 'dev' | 'prod';
    outputPath: string;
    examplePath: string;
    inputs: string[];
    output: string;
};

export default async function (options: ExecutorOptions) {
    try {
        await generateFiles(options);

        return { success: true, terminalOutput: `Generating example [${options.examplePath}]` };
    } catch (e) {
        console.error(e);
        return { success: false };
    }
}

export async function generateFiles(options: ExecutorOptions) {
    const failures: Map<string, [Error, string]> = new Map();

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
                });
                if (!failures.has(internalFramework)) {
                    await deleteFile(errorsPath);
                }
            } catch (error) {
                failures.set(internalFramework, [error, errorsPath]);
                await writeFile(errorsPath, String(error));
                continue;
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
