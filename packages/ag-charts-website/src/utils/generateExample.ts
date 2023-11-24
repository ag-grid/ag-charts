import { getGalleryExampleThemePages } from '@features/gallery/utils/pageData';
import { transformPlainEntryFile } from '@features/gallery/utils/transformPlainEntryFile';
import type { ThemeName } from '@stores/themeStore';
import { getEntry } from 'astro:content';
import { JSDOM } from 'jsdom';
import sharp from 'sharp';

import { AgCharts } from 'ag-charts-community';
// eslint-disable-next-line @nx/enforce-module-boundaries
import 'ag-charts-enterprise';

// eslint-disable-next-line @nx/enforce-module-boundaries
import * as mockCanvas from '../../../ag-charts-community/src/chart/test/mock-canvas';
import { DEFAULT_THUMBNAIL_HEIGHT, DEFAULT_THUMBNAIL_WIDTH } from '../features/gallery/constants';
import { getGeneratedGalleryContents } from '../features/gallery/utils/examplesGenerator';

export const prerender = true;

interface Params {
    exampleName: string;
    theme: ThemeName;
    format: 'png' | 'webp';
}

export async function getStaticPaths() {
    const galleryDataEntry = await getEntry('gallery', 'data');
    const pages = getGalleryExampleThemePages({ galleryData: galleryDataEntry.data });
    return pages;
}

export async function generateExample({ exampleName, theme, format }: Params) {
    const jsdom = new JSDOM('<html><head><style></style></head><body><div id="myChart"></div></body></html>');

    const mockCtx = mockCanvas.setup({
        width: DEFAULT_THUMBNAIL_WIDTH,
        height: DEFAULT_THUMBNAIL_HEIGHT,
        document: jsdom.window.document,
        window: jsdom.window as any,
        mockText: false,
    });

    try {
        // eslint-disable-next-line no-console
        console.log(`Generating [${exampleName}] with theme [${theme}]`);
        const { entryFileName, files = {} } =
            (await getGeneratedGalleryContents({
                exampleName,
                ignoreDarkMode: true,
            })) || {};
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

        const chartProxy = AgCharts.create(options);
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

        chart.destroy();

        return {
            body: result,
            encoding: 'binary',
        };
    } catch (e) {
        throw new Error(`Unable to render example [${exampleName}] with theme [${theme}]: ${e}`);
    } finally {
        mockCanvas.teardown(mockCtx);
    }
}
