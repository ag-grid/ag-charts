import type { Locator, Page } from '@playwright/test';

import { expect, test } from './fixture';
import {
    SELECTORS,
    gotoExample,
    setupIntrinsicAssertions,
    toExamplePageUrls,
    toGalleryPageUrls,
    waitForAllChartUpdates,
} from './util';

export type Status = 'ok' | '404';
export type ClickOrder = 'normal' | 'reverse';

type ExampleCommonOptions = {
    status: Status;
    clickOrder: ClickOrder;
    skipCanvasInitCheck: boolean;
    skipCanvasUpdateCheck: boolean | string[];
    ignoreConsoleWarnings: boolean;
    randomData: boolean;
};

export type ExampleOptions = {
    pagePath: string;
    url: string;
    example: string;
    framework: string;
    snapshot: boolean;
} & ExampleCommonOptions;

export type ExampleOverrides = {
    frameworks?: string[];
    snapshot?: boolean;
} & Partial<ExampleCommonOptions>;

export async function triggerExampleTooltips(page: Page) {
    const wrappers = page.locator(SELECTORS.wrapper);
    const wrapperCount = await wrappers.count();

    for (let i = 0; i < wrapperCount; i++) {
        const wrapper = wrappers.nth(i);
        const focusTarget = wrapper.locator('[tabindex="0"]').first();

        if ((await focusTarget.count()) > 0) {
            await focusTarget.focus();
        }

        let tooltipVisible = await isTooltipVisible(wrapper);

        if (!tooltipVisible) {
            await page.keyboard.press('Tab');
            await waitForAllChartUpdates(page);
            tooltipVisible = await isTooltipVisible(wrapper);
        }

        if (!tooltipVisible) {
            await page.keyboard.press('ArrowRight');
            await waitForAllChartUpdates(page);
            tooltipVisible = await isTooltipVisible(wrapper);
        }

        await waitForAllChartUpdates(page);
    }
}

async function isTooltipVisible(wrapper: Locator) {
    const tooltips = wrapper.locator(SELECTORS.tooltip);
    if ((await tooltips.count()) === 0) {
        return false;
    }
    return tooltips.first().isVisible();
}

export function convertPageUrls(
    path: string,
    exampleOptions: Record<string, Record<string, ExampleOverrides>>,
    ignorePages = ['benchmarks']
) {
    const astroPath = path.split('content/').at(1)!;
    const [pagePath, examplePath] = astroPath.split('/_examples/');
    const example = examplePath.replace(/\/[a-zA-Z-]+\.ts$/, '');

    const page = pagePath.replace(/^docs\//, '');
    const pages = pagePath === 'gallery' ? toGalleryPageUrls(example) : toExamplePageUrls(page, example);

    if (ignorePages.some((m) => (typeof m === 'string' ? m === page : m.test(page)))) {
        return [];
    }

    let options = exampleOptions[page];
    if (options == null) {
        // eslint-disable-next-line no-restricted-properties
        for (const [key, value] of Object.entries(exampleOptions)) {
            if (!key.startsWith('/')) continue;
            const re = new RegExp(key.slice(1));
            if (re.test(page)) {
                options = value;
                break;
            }
        }
    }

    const defaults = pagePath.endsWith('-test')
        ? {
              frameworks: ['vanilla'],
          }
        : {};

    const {
        frameworks,
        status = 'ok',
        clickOrder = 'normal',
        skipCanvasInitCheck = false,
        skipCanvasUpdateCheck = false,
        ignoreConsoleWarnings = false,
        randomData = false,
        snapshot = false,
    } = {
        ...defaults,
        ...options?.['*'],
        ...options?.[example],
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
                skipCanvasInitCheck,
                skipCanvasUpdateCheck,
                ignoreConsoleWarnings,
                randomData,
                snapshot,
            })
        );
}

export function createTestCase(
    testFn: typeof test,
    opts: ExampleOptions,
    config: ReturnType<typeof setupIntrinsicAssertions>,
    initialCallback?: (page: Page) => Promise<void>,
    finalCallback?: (page: Page) => Promise<void>
) {
    const { url, status, framework, clickOrder, skipCanvasInitCheck, skipCanvasUpdateCheck, ignoreConsoleWarnings } =
        opts;

    // Use a special test title suffix to indicate console warnings should be ignored
    const titleSuffix = ignoreConsoleWarnings ? ' [ignoreConsoleWarnings]' : '';

    if (status === 'ok') {
        testFn(`should load ${url}${titleSuffix}`, async ({ page }) => {
            test.slow(framework === 'angular', 'allow more time for Angular load times');

            // Load example and wait for things to settle.
            await gotoExample(page, url, { skipCanvasInitCheck });

            await initialCallback?.(page);

            // Check we're dealing with a single canvas, otherwise things get tricky!
            const canvases = await page.locator('.ag-charts-wrapper').all();
            if (canvases.length > 1) return;
            const canvas = canvases[0];

            // Try pressing the buttons to see if any errors are thrown.
            const buttons = await page.locator('.example-controls > button').all();
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

            await finalCallback?.(page);
        });
    }

    if (status === '404') {
        testFn(`should 404 on ${url}`, async ({ page }) => {
            await page.goto(url);
            expect(await page.title()).toMatch(/Page Not Found/);
        });
    }
}
