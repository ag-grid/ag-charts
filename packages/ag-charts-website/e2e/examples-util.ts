import { Page } from '@playwright/test';

import { expect, test } from './fixture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrls, toGalleryPageUrls } from './util';

export type Status = 'ok' | '404';
export type ClickOrder = 'normal' | 'reverse';

type ExampleCommonOptions = {
    status: Status;
    clickOrder: ClickOrder;
    skipCanvasUpdateCheck: boolean | string[];
    ignoreConsoleWarnings: boolean;
    randomData: boolean;
};

export type ExampleOptions = {
    pagePath: string;
    url: string;
    example: string;
    framework: string;
} & ExampleCommonOptions;

export type ExampleOverrides = {
    frameworks?: string[];
    skipFrameworks?: boolean;
} & Partial<ExampleCommonOptions>;

const ignorePages = ['benchmarks', /.*-test/];
export function convertPageUrls(path: string, exampleOptions: Record<string, Record<string, ExampleOverrides>>) {
    const astroPath = path.split('content/').at(1)!;
    const [pagePath, examplePath] = astroPath.split('/_examples/');
    const example = examplePath.replace(/\/[a-zA-Z-]+\.ts$/, '');

    const page = pagePath.replace(/^docs\//, '');
    const pages = pagePath === 'gallery' ? toGalleryPageUrls(example) : toExamplePageUrls(page, example);

    if (ignorePages.some((m) => (typeof m === 'string' ? m === page : m.test(page)))) {
        return [];
    }

    const {
        frameworks,
        status = 'ok',
        clickOrder = 'normal',
        skipCanvasUpdateCheck = false,
        ignoreConsoleWarnings = false,
        randomData = false,
    } = {
        ...exampleOptions[page]?.['*'],
        ...exampleOptions[page]?.[example],
    };

    return pages
        .filter((r) => frameworks?.includes(r.framework) !== false)
        .map(
            ({ url, example: pageExample, framework }): ExampleOptions => ({
                pagePath,
                url,
                example: pageExample,
                framework,
                status,
                clickOrder,
                skipCanvasUpdateCheck,
                ignoreConsoleWarnings,
                randomData,
            })
        );
}

export function createTestCase(
    testFn: typeof test,
    opts: ExampleOptions,
    config: ReturnType<typeof setupIntrinsicAssertions>,
    pageProvider: () => Page,
    initialCallback?: (page: Page) => Promise<void>
) {
    const { url, status, framework, clickOrder, skipCanvasUpdateCheck, ignoreConsoleWarnings } = opts;

    if (status === 'ok') {
        testFn(`should load ${url}`, async () => {
            test.slow(framework === 'angular', 'allow more time for Angular load times');

            const page = pageProvider();

            config.ignoreConsoleWarnings = ignoreConsoleWarnings;

            // Load example and wait for things to settle.
            await gotoExample(page, url);

            await initialCallback?.(page);

            // Check we're dealing with a single canvas, otherwise things get tricky!
            const canvases = await page.locator('.ag-charts-wrapper').all();
            if (canvases.length > 1) return;
            const canvas = canvases[0];

            // Try pressing the buttons to see if any errors are thrown.
            const buttons = await page.locator('.toolbar > button').all();
            if (clickOrder === 'reverse') buttons.reverse();

            for (const button of buttons) {
                const sceneRenderCount = Number(await canvas.getAttribute('data-scene-renders'));

                await button.click();

                const skip =
                    skipCanvasUpdateCheck === true ||
                    (Array.isArray(skipCanvasUpdateCheck) &&
                        skipCanvasUpdateCheck.includes((await button.textContent()) ?? 'unknown'));
                if (skip) {
                    await page.waitForLoadState('networkidle');
                } else {
                    await expect
                        .configure({
                            message: `Pressing button ${await button.textContent()}`,
                        })
                        .poll(async () => Number(await canvas.getAttribute('data-scene-renders')))
                        .toBeGreaterThan(sceneRenderCount);
                }
            }
        });
    }

    if (status === '404') {
        testFn(`should 404 on ${url}`, async ({ page }) => {
            config.ignore404s = true;
            await page.goto(url);
            expect(await page.title()).toMatch(/Page Not Found/);
        });
    }
}
