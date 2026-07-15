import { type GeneratedContents, transformPlainEntryFile } from '_ag-charts-generate-example-files';
import { mockCanvas } from '_ag-charts-test';
import { promises as fs } from 'fs';
import { JSDOM } from 'jsdom';
import path from 'path';
import sharp from 'sharp';
import { Canvas, type CanvasRenderingContext2D } from 'skia-canvas';

import { type AgChartOptions, type AgChartThemeName, AgCharts } from 'ag-charts-community';
import { deepClone } from 'ag-charts-core';
import { AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

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

ModuleRegistry.registerModules(AllEnterpriseModule);

type ChartApi = 'create' | 'createGauge' | 'createFinancialChart';

export interface PreparedExample {
    optionsById: Map<string, AgChartOptions>;
    api: ChartApi;
    layout: ReturnType<typeof getChartLayout>;
}

interface Params {
    prepared: PreparedExample;
    theme: AgChartThemeName;
    outputPath: string;
    dpi: number;
    mockText: boolean;
}

// The entry-file transform and layout parse depend only on the example, not on the theme/DPI
// render variant, so they are computed once per example rather than per render.
export function prepareExample(example: GeneratedContents): PreparedExample {
    const { entryFileName, files = {} } = example;
    const entryFile: string = files[entryFileName];

    const preamble = Object.entries(files).map(([fileName, contents]) => {
        if (fileName.endsWith('.js') && fileName !== entryFileName) {
            return contents;
        } else {
            return '';
        }
    });
    const { optionsById } = transformPlainEntryFile(entryFile, preamble);
    const api = entryFile.match(/AgCharts.(create[\w]*)/)![1] as ChartApi;

    return { optionsById, api, layout: getChartLayout(files['index.html']) };
}

export async function generateThumbnail({ prepared, theme, outputPath, dpi, mockText }: Params) {
    const { optionsById, api } = prepared;
    const { rows, columns, charts } = prepared.layout;

    let output: { multiple: true; canvas: Canvas; ctx: CanvasRenderingContext2D } | { multiple: false; buffer: Buffer };
    if (charts.length > 1) {
        const canvas = new mockCanvas.ConfiguredCanvas(DEFAULT_THUMBNAIL_WIDTH * dpi, DEFAULT_THUMBNAIL_HEIGHT * dpi);
        const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

        ctx.fillStyle = BACKGROUND_COLORS[theme];
        ctx.fillRect(0, 0, DEFAULT_THUMBNAIL_WIDTH * dpi, DEFAULT_THUMBNAIL_HEIGHT * dpi);

        output = { multiple: true, canvas, ctx };
    } else {
        output = { multiple: false, buffer: undefined! };
    }

    for (const { id, row, column } of charts) {
        const {
            window,
            window: { document },
        } = new JSDOM(`<html><head><style></style></head><body></body></html>`, { url: 'http://localhost/' });
        window.requestAnimationFrame = (cb) => setTimeout(cb, 0);

        // One instance per DPI setting.
        const mockCtx = new mockCanvas.MockContext(
            DEFAULT_THUMBNAIL_WIDTH * dpi,
            DEFAULT_THUMBNAIL_HEIGHT * dpi,
            document
        );
        mockCtx.mockText = mockText;
        mockCanvas.setup(mockCtx);

        const baseOptions = optionsById.get(id);
        if (baseOptions == null) {
            throw new Error(`No options found for container with id "${id}"`);
        }
        // patchOptions mutates its input; clone per render so the shared prepared options are untouched.
        const options = patchOptions(deepClone(baseOptions), theme, output.multiple, api);

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

        const chartProxy = AgCharts[api]({
            ...options,
            document,
            window,
            width,
            height,
            overrideDevicePixelRatio: dpi,
        } as any);

        try {
            await chartProxy.waitForUpdate();

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
                output.buffer = mockCtx.ctx.nodeCanvas.toBufferSync('png');
            }
        } finally {
            // Release per-render resources promptly and restore the global document.createElement /
            // OffscreenCanvas overrides installed by mockCanvas.setup, keeping live garbage down
            // across the theme x DPI loop. Runs on the render-error path too.
            chartProxy.destroy();
            mockCanvas.teardown(mockCtx);
            window.close();
        }
    }

    const buffer = output.multiple === true ? output.canvas.toBufferSync('png') : output.buffer;

    const dpiExt = dpi === 1 ? '' : `@${dpi}x`;
    const fontExt = mockText ? '-platform-agnostic' : '';
    const baseFilename = `${theme}${fontExt}${dpiExt}`;

    // The canvas buffer is already PNG-encoded; only the webp output needs a sharp re-encode.
    await Promise.all([
        fs.writeFile(path.join(outputPath, `${baseFilename}.png`), buffer),
        sharp(buffer)
            .webp({ quality: 90 })
            .toFile(path.join(outputPath, `${baseFilename}.webp`)),
    ]);
}
