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
    DETAIL_FULL_WIDTH,
    MAX_ASPECT_RATIO,
    MIN_ASPECT_RATIO,
} from './constants';
import { getChartLayout } from './getChartLayout';
import { patchOptions } from './patchOptions';

interface Params {
    example: GeneratedContents;
    theme: AgChartThemeName;
    outputPath: string;
    dpi: number;
}

export async function generateExample({ example, theme, outputPath, dpi }: Params) {
    const { files = {} } = example;

    const optionsJson = files['_options.json'];
    if (optionsJson == null) {
        throw new Error('_options.json not found - check your source example has a /* @ag-options-extract */ comment.');
    }
    const optionsById = JSON.parse(optionsJson);

    const { rows, columns, charts } = getChartLayout(files['index.html']);

    let output: { multiple: true; canvas: Canvas; ctx: CanvasRenderingContext2D } | { multiple: false; buffer: Buffer };
    if (charts.length > 1) {
        const canvas = new Canvas(DEFAULT_THUMBNAIL_WIDTH * dpi, DEFAULT_THUMBNAIL_HEIGHT * dpi);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = BACKGROUND_COLORS[theme];
        ctx.fillRect(0, 0, DEFAULT_THUMBNAIL_WIDTH * dpi, DEFAULT_THUMBNAIL_HEIGHT * dpi);

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

        // Note - we'll need one instance per DPI setting
        const mockCtx = mockCanvas.setup({
            width: DEFAULT_THUMBNAIL_WIDTH * dpi,
            height: DEFAULT_THUMBNAIL_HEIGHT * dpi,
            document,
            mockText: false,
        });

        const chartProxy = AgCharts.create({
            animation: { enabled: false },
            document,
            window,
            width: DEFAULT_THUMBNAIL_WIDTH,
            height: DEFAULT_THUMBNAIL_HEIGHT,
            overrideDevicePixelRatio: dpi,
        } as any);
        /* End TODO */

        const options = optionsById[id];
        if (options == null) {
            throw new Error(`No options found for container with id "${id}"`);
        }
        patchOptions(options, theme);

        const containerWidth = (DEFAULT_THUMBNAIL_WIDTH / columns) | 0;
        const containerHeight = (DEFAULT_THUMBNAIL_HEIGHT / rows) | 0;

        let width: number;
        let height: number;
        if (options.width != null) {
            const detailContainerHeight = DETAIL_FULL_HEIGHT / rows;
            let aspectRatio = options.width / detailContainerHeight;
            aspectRatio = Math.min(Math.max(aspectRatio, MIN_ASPECT_RATIO), MAX_ASPECT_RATIO);
            width = Math.min(containerHeight * aspectRatio, containerWidth);
            height = containerHeight;
        } else if (options.height == null) {
            width = containerWidth;
            height = containerHeight;
        } else {
            const detailContainerWidth = DETAIL_FULL_WIDTH / columns;
            let aspectRatio = detailContainerWidth / options.height;
            aspectRatio = Math.min(Math.max(aspectRatio, MIN_ASPECT_RATIO), MAX_ASPECT_RATIO);
            width = containerWidth;
            height = Math.min(containerWidth / aspectRatio, containerHeight);
        }

        const x0 = (containerWidth * column + (containerWidth - width) / 2) | 0;
        const y0 = (containerHeight * row + (containerHeight - height) / 2) | 0;

        AgCharts.update(chartProxy, {
            ...options,
            animation: { enabled: false },
            document,
            window,
            width,
            height,
            overrideDevicePixelRatio: dpi,
        } as any);

        const chart = (chartProxy as any).chart;
        await chart.waitForUpdate(5_000);

        if (output.multiple === true) {
            output.ctx.drawImage(
                mockCtx.ctx.nodeCanvas,
                0,
                0,
                width * dpi,
                height * dpi,
                x0 * dpi,
                y0 * dpi,
                width * dpi,
                height * dpi
            );
        } else {
            output.buffer = mockCtx.ctx.nodeCanvas.toBuffer('image/png');
        }
    }

    const buffer = output.multiple === true ? output.canvas.toBuffer('image/png') : output.buffer;

    const s = sharp(buffer);

    const dpiExt = dpi === 1 ? '' : `@${dpi}x`;

    await Promise.all([
        s
            .clone()
            .png()
            .toFile(path.join(outputPath, `${theme}${dpiExt}.png`)),
        s
            .clone()
            .webp()
            .toFile(path.join(outputPath, `${theme}${dpiExt}.webp`)),
    ]);
}
