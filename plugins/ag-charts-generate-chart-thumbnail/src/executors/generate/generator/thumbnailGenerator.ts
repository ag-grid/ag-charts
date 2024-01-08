import { Canvas, type CanvasRenderingContext2D } from 'canvas';
import { JSDOM } from 'jsdom';
import path from 'path';
import sharp from 'sharp';

import { type AgChartThemeName, AgCharts } from 'ag-charts-community';
import 'ag-charts-enterprise';
import type { GeneratedContents } from 'ag-charts-generate-example-files/src/executors/generate/generator/types';
import { mockCanvas } from 'ag-charts-test';

import {
    BACKGROUND_COLORS,
    DEFAULT_THUMBNAIL_HEIGHT,
    DEFAULT_THUMBNAIL_WIDTH,
    DETAIL_FULL_HEIGHT,
    MIN_ASPECT_RATIO,
} from './constants';
import { getChartLayout } from './getChartLayout';
import { patchOptions } from './patchOptions';
import { transformPlainEntryFile } from './transformPlainEntryFile';

const DEFAULT_ASPECT_RATIO = DEFAULT_THUMBNAIL_WIDTH / DEFAULT_THUMBNAIL_HEIGHT;

interface Params {
    example: GeneratedContents;
    theme: AgChartThemeName;
    outputPath: string;
}

export async function generateExample({ example, theme, outputPath }: Params) {
    const { entryFileName, files = {} } = example;

    const entryFile = files[entryFileName];
    const { optionsById } = transformPlainEntryFile(entryFile, files['data.js']);

    const { rows, columns, charts } = getChartLayout(files['index.html']);

    let output: { multiple: true; canvas: Canvas; ctx: CanvasRenderingContext2D } | { multiple: false; buffer: Buffer };
    if (charts.length > 1) {
        const canvas = new Canvas(DEFAULT_THUMBNAIL_WIDTH, DEFAULT_THUMBNAIL_HEIGHT);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = BACKGROUND_COLORS[theme];
        ctx.fillRect(0, 0, DEFAULT_THUMBNAIL_WIDTH, DEFAULT_THUMBNAIL_HEIGHT);

        output = { multiple: true, canvas, ctx };
    } else {
        output = { multiple: false, buffer: undefined! };
    }

    for (const { id, row, column } of charts) {
        /* TODO: Initialize these once */
        const {
            window,
            window: { document },
        } = new JSDOM(`<html><head><style></style></head><body></body></html>`);

        const mockCtx = mockCanvas.setup({
            width: DEFAULT_THUMBNAIL_WIDTH,
            height: DEFAULT_THUMBNAIL_HEIGHT,
            document,
            window: window as any,
            mockText: false,
        });

        const chartProxy = AgCharts.create({
            animation: { enabled: false },
            document,
            window,
            width: DEFAULT_THUMBNAIL_WIDTH,
            height: DEFAULT_THUMBNAIL_HEIGHT,
        } as any);
        /* End TODO */

        const options = optionsById.get(id);
        if (options == null) {
            throw new Error(`No options found for container with id "${id}"`);
        }
        patchOptions(options, theme);

        const containerWidth = (DEFAULT_THUMBNAIL_WIDTH / columns) | 0;
        const containerHeight = (DEFAULT_THUMBNAIL_HEIGHT / rows) | 0;

        let width: number;
        let height: number;
        if (options.width != null) {
            const aspectRatio = Math.max(options.width / (DETAIL_FULL_HEIGHT / rows), MIN_ASPECT_RATIO);
            width = containerHeight * aspectRatio;
            height = containerHeight;
        } else {
            width = containerWidth;
            height = containerHeight;
        }

        const x0 = (containerWidth * column + (containerWidth - width) / 2) | 0;
        const y0 = (containerWidth * row + (containerHeight - height) / 2) | 0;

        AgCharts.update(chartProxy, {
            ...options,
            animation: { enabled: false },
            document,
            window,
            width,
            height,
        } as any);

        const chart = (chartProxy as any).chart;
        await chart.waitForUpdate(5_000);

        if (output.multiple === true) {
            output.ctx.drawImage(mockCtx.ctx.nodeCanvas, 0, 0, width, height, x0, y0, width, height);
        } else {
            output.buffer = mockCtx.ctx.nodeCanvas.toBuffer('image/png');
        }
    }

    const buffer = output.multiple === true ? output.canvas.toBuffer('image/png') : output.buffer;

    const s = sharp(buffer);

    await Promise.all([
        s
            .clone()
            .png()
            .toFile(path.join(outputPath, `${theme}.png`)),
        s
            .clone()
            .webp()
            .toFile(path.join(outputPath, `${theme}.webp`)),
    ]);
}
