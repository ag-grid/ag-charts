/* eslint-disable no-console */
import path from 'path';

import { writeFile } from '../../executors-utils';
import { getGeneratedContents } from './generator/examplesGenerator';
import { FRAMEWORKS } from './generator/types';

type ExecutorOptions = {
    mode: 'dev' | 'prod';
    outputPath: string;
    examplePath: string;
    inputs: string[];
    output: string;
};

export default async function (options: ExecutorOptions) {
    try {
        console.log(`Generating example [${options.examplePath}]`);

        await generateFiles(options);

        console.log('Generation completed.');

        return { success: true };
    } catch (e) {
        console.error(e, { options });
        return { success: false };
    }
}

async function generateFiles(options: ExecutorOptions) {
    for (const ignoreDarkMode of [false, true]) {
        const darkModePath = ignoreDarkMode ? 'plain' : 'dark-mode';
        for (const internalFramework of FRAMEWORKS) {
            const result = await getGeneratedContents({
                folderPath: options.examplePath,
                internalFramework,
                ignoreDarkMode,
                isDev: options.mode === 'dev',
            });

            writeFile(
                path.join(options.outputPath, darkModePath, internalFramework, 'contents.json'),
                JSON.stringify(result)
            );
        }
    }
}
