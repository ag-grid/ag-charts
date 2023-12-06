/* eslint-disable no-console */
import path from 'path';

import { writeFile } from '../../executors-utils';
import { getGeneratedContents } from './generator/examplesGenerator';

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
    const result = await getGeneratedContents({
        folderPath: options.examplePath,
        internalFramework: 'vanilla',
        isDev: options.mode === 'dev',
    });
    console.log({ result });

    for (const [filename, content] of Object.entries(result.files)) {
        writeFile(path.join(options.outputPath, filename), content);
    }
}
