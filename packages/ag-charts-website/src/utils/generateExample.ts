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
import { THUMBNAIL_POOL_SIZE } from '../constants';
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

function buildPoolEntry() {
    const jsdom = new JSDOM('<html><head><style></style></head><body><div id="myChart"></div></body></html>');

    const mockCtx = mockCanvas.setup({
        width: DEFAULT_THUMBNAIL_WIDTH,
        height: DEFAULT_THUMBNAIL_HEIGHT,
        document: jsdom.window.document,
        window: jsdom.window as any,
        mockText: false,
    });

    const options = {
        animation: { enabled: false },
        document: jsdom.window.document,
        window: jsdom.window,
        width: DEFAULT_THUMBNAIL_WIDTH,
        height: DEFAULT_THUMBNAIL_HEIGHT,
    } as any;

    const chartProxy = AgCharts.create(options);

    return [jsdom, mockCtx, chartProxy] as const;
}

const pool: ReturnType<typeof buildPoolEntry>[] = [];

function initPool() {
    // eslint-disable-next-line no-console
    console.log(`Creating thumbnail pool of size ${THUMBNAIL_POOL_SIZE}`);
    for (let i = 0; i < THUMBNAIL_POOL_SIZE; i++) {
        pool.push(buildPoolEntry());
    }
}
initPool();

async function borrowFromPool() {
    let count = 0;
    while (pool.length === 0 && count < 5) {
        // eslint-disable-next-line no-console
        console.log('Waiting for pool to become available...');
        await new Promise((resolve) => setTimeout(resolve, (10 * count) ^ 2));
        count++;
    }

    if (pool.length === 0) {
        throw new Error('No JSDOM instance available to borrow.');
    }

    return pool.splice(0, 1)[0];
}

function returnToPool(poolEntry: ReturnType<typeof buildPoolEntry>) {
    pool.push(poolEntry);
}

export async function generateExample({ exampleName, theme, format }: Params) {
    const poolEntry = await borrowFromPool();
    const [jsdom, mockCtx, chartProxy] = poolEntry;

    try {
        // eslint-disable-next-line no-console
        console.log(`Generating [${exampleName}] with theme [${theme}] in format [${format}]`);
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

        return {
            body: result,
            encoding: 'binary',
        };
    } catch (e) {
        throw new Error(`Unable to render example [${exampleName}] with theme [${theme}]: ${e}`, { cause: e });
    } finally {
        returnToPool(poolEntry);
    }
}
