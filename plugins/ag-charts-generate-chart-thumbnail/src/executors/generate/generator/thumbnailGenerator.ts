import sharp from 'sharp';

import { type AgChartThemeName, AgCharts } from 'ag-charts-community';
// eslint-disable-next-line @nx/enforce-module-boundaries
import 'ag-charts-enterprise';
import type { GeneratedContents } from 'ag-charts-generate-example-files/src/executors/generate/generator/types';

import { DEFAULT_THUMBNAIL_HEIGHT, DEFAULT_THUMBNAIL_WIDTH } from './constants';
import { borrowFromPool, returnToPool } from './environment';
import { transformPlainEntryFile } from './transformPlainEntryFile';

export const prerender = true;

interface Params {
    name: string;
    example: GeneratedContents;
    theme: AgChartThemeName;
    format: 'png' | 'webp';
}

export async function generateExample({ name, example, theme, format }: Params) {
    const { entryFileName, files = {} } = example;

    const poolEntry = await borrowFromPool();
    const [jsdom, mockCtx, chartProxy] = poolEntry;

    try {
        const entryFile = files[entryFileName!];
        let {
            options,
            options: { width, height, padding },
        } = transformPlainEntryFile(entryFile, files['data.js'], theme);
        width ??= DEFAULT_THUMBNAIL_WIDTH;
        height ??= DEFAULT_THUMBNAIL_HEIGHT;

        // If there is a custom width/height try to maintain the right aspect ratio.
        if (width != DEFAULT_THUMBNAIL_WIDTH && height != DEFAULT_THUMBNAIL_HEIGHT) {
            const defaultAspectRatio = DEFAULT_THUMBNAIL_WIDTH / DEFAULT_THUMBNAIL_HEIGHT;
            const aspectRatio = width / height;
            if (aspectRatio >= defaultAspectRatio) {
                width = DEFAULT_THUMBNAIL_WIDTH;
                height = Math.round(width / aspectRatio);
            } else {
                height = DEFAULT_THUMBNAIL_HEIGHT;
                width = Math.round(height * aspectRatio);
            }
        }

        const horizontalPad = (DEFAULT_THUMBNAIL_WIDTH - width) / 2;
        const verticalPad = (DEFAULT_THUMBNAIL_HEIGHT - height) / 2;
        // Apply chart padding to center chart in canvas.
        padding = {
            top: (padding?.top ?? 0) + verticalPad,
            bottom: (padding?.bottom ?? 0) + verticalPad,
            left: (padding?.left ?? 0) + horizontalPad,
            right: (padding?.right ?? 0) + horizontalPad,
        };

        options = {
            ...options,
            animation: { enabled: false },
            document: jsdom.window.document,
            window: jsdom.window,
            width: DEFAULT_THUMBNAIL_WIDTH,
            height: DEFAULT_THUMBNAIL_HEIGHT,
            padding,
        } as any;

        AgCharts.update(chartProxy, options);
        const chart = (chartProxy as any).chart;
        await chart.waitForUpdate(5_000);

        const buffer = mockCtx.ctx.nodeCanvas?.toBuffer();

        let result: Buffer;
        switch (format) {
            case 'png':
                result = await sharp(buffer).png().toBuffer();
                break;
            case 'webp':
                result = await sharp(buffer).webp().toBuffer();
                break;
        }

        return result;
    } catch (e) {
        throw new Error(`Unable to render example [${name}] with theme [${theme}]: ${e}`);
    } finally {
        returnToPool(poolEntry);
    }
}
