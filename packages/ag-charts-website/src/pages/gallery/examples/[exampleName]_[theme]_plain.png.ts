import { getGalleryExamplePages } from '@features/gallery/utils/pageData';
import { transformPlainEntryFile } from '@features/gallery/utils/transformPlainEntryFile';
import type { ThemeName } from '@stores/themeStore';
import { getEntry } from 'astro:content';
import { JSDOM } from 'jsdom';

import { AgEnterpriseCharts } from 'ag-charts-enterprise';

// eslint-disable-next-line @nx/enforce-module-boundaries
import * as mockCanvas from '../../../../../ag-charts-community/src/chart/test/mock-canvas';
import { DEFAULT_THUMBNAIL_HEIGHT, DEFAULT_THUMBNAIL_WIDTH } from '../../../features/gallery/constants';
import { getGeneratedGalleryContents } from '../../../features/gallery/utils/examplesGenerator';

export const prerender = true;

interface Params {
    exampleName: string;
    theme: ThemeName;
}

export async function getStaticPaths() {
    const galleryDataEntry = await getEntry('gallery', 'data');
    const pages = getGalleryExamplePages({ galleryData: galleryDataEntry.data });
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
        const { entryFileName, files = {} } =
            (await getGeneratedGalleryContents({
                exampleName,
            })) || {};
        const entryFile = files[entryFileName!];
        let { options } = transformPlainEntryFile(entryFile, files['data.js']);
        options = {
            ...options,
            theme,
            animation: { enabled: false },
            document: jsdom.window.document,
            window: jsdom.window,
            width: DEFAULT_THUMBNAIL_WIDTH,
            height: DEFAULT_THUMBNAIL_HEIGHT,
        };

        const chartProxy = AgEnterpriseCharts.create(options);
        const chart = (chartProxy as any).chart;
        await chart.waitForUpdate(5_000);

        const result = mockCtx.ctx.nodeCanvas?.toBuffer();

        chart.destroy();

        return {
            body: result,
            encoding: 'binary',
        };
    } finally {
        mockCanvas.teardown(mockCtx);
    }
}
