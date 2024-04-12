/* eslint-disable no-console */
import type { ExecutorContext } from '@nx/devkit';
import { CanvasRenderingContext2D, DOMMatrix } from 'canvas';
import path from 'path';
import { Path2D, applyPath2DToCanvasRenderingContext } from 'path2d';

import type { AgChartThemeName } from 'ag-charts-community';

import { consolePrefix, ensureDirectory, readJSONFile } from '../../executors-utils';
import { generateThumbnail } from './generator/thumbnailGenerator';

global.DOMMatrix = DOMMatrix as any;
global.Path2D = Path2D;

applyPath2DToCanvasRenderingContext(CanvasRenderingContext2D);

export type ExecutorOptions = {
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
        console.error(e);
        return { success: false };
    }
}

export async function generateFiles(options: ExecutorOptions, ctx: ExecutorContext) {
    const { generatedExamplePath, outputPath } = options;
    const name = `${ctx.projectName}:${ctx.targetName}:${ctx.configurationName ?? ''}`;
    const jsonPath = path.join(generatedExamplePath, 'plain', 'vanilla', 'contents.json');
    const example = await readJSONFile(jsonPath);
    const production = ['production', 'staging'].includes(process.env.NX_TASK_TARGET_CONFIGURATION);
    const dpiOutputs = production ? [1, 2] : [1];

    if (example == null) {
        throw new Error(`Unable to read generated example: [${jsonPath}]`);
    }

    await ensureDirectory(outputPath);

    const timesCalled = await consolePrefix(`[${ctx.projectName}] `, async () => {
        for (const theme of Object.keys(THEMES) as AgChartThemeName[]) {
            for (const dpi of dpiOutputs) {
                try {
                    await generateThumbnail({ example, theme, outputPath, dpi, mockText: false });
                } catch (e) {
                    throw new Error(`Unable to render example [${name}] with theme [${theme}]: ${e}`);
                }
            }
        }

        // Generate a platform agnostic (font-wise) rendering for visual comparison purposes.
        await generateThumbnail({ example, theme: 'ag-default', outputPath, dpi: 1, mockText: true });
    });

    if (timesCalled.error > 0) {
        throw new Error(`Error when rendering example [${name}] - see console output.`);
    }
}
