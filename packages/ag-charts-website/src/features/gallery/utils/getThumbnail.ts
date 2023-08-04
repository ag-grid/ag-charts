import { chromium } from 'playwright';
import { getPlainExampleUrl } from './urlPaths';
import { DEFAULT_THUMBNAIL_HEIGHT, DEFAULT_THUMBNAIL_WIDTH } from '../constants';
import { pathJoin } from '@utils/pathJoin';

export async function getThumbnail({
    exampleName,
    width = DEFAULT_THUMBNAIL_WIDTH,
    height = DEFAULT_THUMBNAIL_HEIGHT,
    baseUrl,
}: {
    exampleName: string;
    width?: number;
    height?: number;
    baseUrl?: string;
}): Promise<Buffer> {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.setViewportSize({ width, height });

    const hasBaseUrl = Boolean(baseUrl);
    const isFullPath = !hasBaseUrl;
    const exampleUrl = getPlainExampleUrl({
        exampleName,
        isFullPath,
        excludeSiteBaseUrl: hasBaseUrl,
    });

    const url = hasBaseUrl ? pathJoin(baseUrl, exampleUrl) : exampleUrl;

    await page.goto(url);
    const buffer = await page.screenshot();
    await browser.close();

    return buffer;
}
