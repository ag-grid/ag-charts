/* eslint-disable no-console */
import type { ExecutorContext } from '@nx/devkit';
import path from 'path';

import type { AgChartThemeName } from 'ag-charts-community';

import { readJSONFile, writeFile } from '../../executors-utils';
import { generateExample } from './generator/thumbnailGenerator';

type ExecutorOptions = {
    outputPath: string;
    generatedExamplePath: string;
};

const THEMES: Record<AgChartThemeName, boolean> = {
    'ag-default': true,
    'ag-default-dark': true,
    'ag-material': true,
    'ag-material-dark': true,
    'ag-polychroma': true,
    'ag-polychroma-dark': true,
    'ag-sheets': true,
    'ag-sheets-dark': true,
    'ag-vivid': true,
    'ag-vivid-dark': true,
};

export default async function (options: ExecutorOptions, ctx: ExecutorContext) {
    try {
        await generateFiles(options, ctx);

        return { success: true, terminalOutput: `Generating thumbnails for [${options.generatedExamplePath}]` };
    } catch (e) {
        const terminalOutput = `${e}`;
        return { success: false, terminalOutput };
    }
}

export async function generateFiles(options: ExecutorOptions, ctx: ExecutorContext) {
    const name = `${ctx.projectName}:${ctx.targetName}:${ctx.configurationName ?? ''}`;
    const jsonPath = path.join(options.generatedExamplePath, 'plain', 'vanilla', 'contents.json');
    const generatedExample = readJSONFile(jsonPath);

    for (const theme of Object.keys(THEMES) as AgChartThemeName[]) {
        for (const format of ['png' as const, 'webp' as const]) {
            const result = await generateExample({
                name,
                example: generatedExample,
                format,
                theme,
            });

            writeFile(path.join(options.outputPath, `${theme}.${format}`), result);
        }
    }
}
