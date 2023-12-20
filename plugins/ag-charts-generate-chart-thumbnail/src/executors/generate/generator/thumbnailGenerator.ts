import { Canvas } from 'canvas';
import { JSDOM } from 'jsdom';
import path from 'path';
import sharp from 'sharp';

import { type AgChartThemeName, AgCharts } from 'ag-charts-community';
import 'ag-charts-enterprise';
import type { GeneratedContents } from 'ag-charts-generate-example-files/src/executors/generate/generator/types';
import { mockCanvas } from 'ag-charts-test';

import { DEFAULT_THUMBNAIL_HEIGHT, DEFAULT_THUMBNAIL_WIDTH } from './constants';
import { transformPlainEntryFile } from './transformPlainEntryFile';

export const prerender = true;

interface Params {
    name: string;
    example: GeneratedContents;
    theme: AgChartThemeName;
    outputPath: string;
}

const getGridArea = (container: HTMLElement) => {
    const gridArea = container.style.gridArea;
    if (gridArea === '') return undefined;

    const match = gridArea.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (match == null) throw new Error(`Expected grid-area to match format of 1 / 1. Received "${gridArea}".`);

    return {
        row: +match[1] - 1,
        column: +match[2] - 1,
    };
};

export async function generateExample({ name, example, theme, outputPath }: Params) {
    const { entryFileName, files = {} } = example;

    try {
        const entryFile = files[entryFileName!];
        const { optionsById } = transformPlainEntryFile(entryFile, files['data.js'], theme);

        const jsdom = new JSDOM(`<html><head><style></style></head><body>${files['index.html']}</body></html>`);
        const { window } = jsdom;
        const { document } = window;

        const outputCanvas = new Canvas(DEFAULT_THUMBNAIL_WIDTH, DEFAULT_THUMBNAIL_HEIGHT);
        const outputCtx = outputCanvas.getContext('2d');

        const chartContainers = Array.from(document.querySelectorAll<HTMLElement>('[id]'));

        let rows = 1;
        let columns = 1;
        chartContainers.forEach((container) => {
            const gridArea = getGridArea(container);
            if (gridArea == null) return;
            rows = Math.max(gridArea.row + 1, rows);
            columns = Math.max(gridArea.column + 1, columns);
        });

        const promises = chartContainers.map(async (container) => {
            const gridArea = getGridArea(container);
            const row = gridArea?.row ?? 0;
            const column = gridArea?.column ?? 0;

            const width = (DEFAULT_THUMBNAIL_WIDTH / columns) | 0;
            const height = (DEFAULT_THUMBNAIL_HEIGHT / rows) | 0;
            const x0 = (width * column) | 0;
            const y0 = (width * row) | 0;

            const mockCtx = mockCanvas.setup({
                width,
                height,
                document,
                window: window as any,
                mockText: false,
            });

            const chartOptions = {
                animation: { enabled: false },
                document,
                window,
                width,
                height,
            } as any;

            const chartProxy = AgCharts.create(chartOptions);

            let options = optionsById.get(container.id);
            if (options == null) {
                throw new Error(`No options found for container with id "${container.id}"`);
            }

            options = {
                ...options,
                theme,
                animation: { enabled: false },
                document,
                window,
                width,
                height,
            } as any;

            AgCharts.update(chartProxy, options);
            const chart = (chartProxy as any).chart;
            await chart.waitForUpdate(5_000);

            // BGRA
            const imageData = mockCtx.ctx.nodeCanvas.toBuffer('raw');
            const outputImage = outputCtx.createImageData(width, height);
            // RGBA
            const outputData = outputImage.data;
            for (let x = 0; x < width; x += 1) {
                for (let y = 0; y < height; y += 1) {
                    const i = ((y * width + x) * 4) | 0;
                    /* R */ outputData[i + 0] = imageData[i + 2];
                    /* G */ outputData[i + 1] = imageData[i + 1];
                    /* B */ outputData[i + 2] = imageData[i + 0];
                    /* A */ outputData[i + 3] = imageData[i + 3];
                }
            }
            outputCtx.putImageData(outputImage, x0, y0);
        });

        await Promise.all(promises);

        const buffer = outputCanvas.toBuffer();

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
    } catch (e) {
        throw new Error(`Unable to render example [${name}] with theme [${theme}]: ${e}`);
    }
}
