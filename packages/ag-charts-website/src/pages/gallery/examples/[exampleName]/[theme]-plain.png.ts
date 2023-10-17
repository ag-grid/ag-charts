import { getGalleryExampleThemePages } from '@features/gallery/utils/pageData';
import { transformPlainEntryFile } from '@features/gallery/utils/transformPlainEntryFile';
import type { ThemeName } from '@stores/themeStore';
import { getEntry } from 'astro:content';
import { JSDOM } from 'jsdom';

import { AgChart } from 'ag-charts-community';
// eslint-disable-next-line @nx/enforce-module-boundaries
import 'ag-charts-enterprise';

// eslint-disable-next-line @nx/enforce-module-boundaries
import * as mockCanvas from '../../../../../../ag-charts-community/src/chart/test/mock-canvas';
import { DEFAULT_THUMBNAIL_HEIGHT, DEFAULT_THUMBNAIL_WIDTH } from '../../../../features/gallery/constants';
import { getGeneratedGalleryContents } from '../../../../features/gallery/utils/examplesGenerator';

export const prerender = true;

interface Params {
    exampleName: string;
    theme: ThemeName;
}

export async function getStaticPaths() {
    const galleryDataEntry = await getEntry('gallery', 'data');
    const pages = getGalleryExampleThemePages({ galleryData: galleryDataEntry.data });
    return pages;
}

export async function get({ params }: { params: Params }) {
    const { exampleName, theme } = params;

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
            })) || {};
        const entryFile = files[entryFileName!];
        let { options } = transformPlainEntryFile(entryFile, files['data.js'], theme);
        options = {
            ...options,
            animation: { enabled: false },
            document: jsdom.window.document,
            window: jsdom.window,
            width: DEFAULT_THUMBNAIL_WIDTH,
            height: DEFAULT_THUMBNAIL_HEIGHT,
        };

        const chartProxy = AgChart.create(options);
        const chart = (chartProxy as any).chart;
        await chart.waitForUpdate(5_000);

        const result = mockCtx.ctx.nodeCanvas?.toBuffer();

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
