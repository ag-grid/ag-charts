import { expect, test } from '@playwright/test';

import { getExamples, gotoExample, setupIntrinsicAssertions, toExamplePageUrls, toGalleryPageUrls } from './util';

type Status = 'ok' | '404';
type ClickOrder = 'normal' | 'reverse';

type ExampleOptions = {
    pagePath: string;
    url: string;
    example: string;
    framework: string;
    status: Status;
    clickOrder: ClickOrder;
    skipCanvasUpdateCheck: boolean;
    ignoreConsoleWarnings: boolean;
};

type ExampleOverrides = {
    frameworks?: string[];
    status?: Status;
    skipFrameworks?: boolean;
    clickOrder?: ClickOrder;
    skipCanvasUpdateCheck?: boolean;
    ignoreConsoleWarnings?: boolean;
};

const ignorePages = ['benchmarks', /.*-test/];
const exampleOptions: Record<string, Record<string, ExampleOverrides>> = {
    gallery: {
        '*': { frameworks: ['vanilla', 'typescript'] },

        // Hidden gallery examples
        'time-axis-with-irregular-intervals': { status: '404' },
        'simple-bubble': { status: '404' },
        'scatter-series-error-bars': { status: '404' },
        'reversed-horizontal-bar': { status: '404' },
        'reversed-bullet': { status: '404' },
        'reversed-bar': { status: '404' },
        'per-marker-customisation': { status: '404' },
        'log-axis': { status: '404' },
        'line-series-error-bars': { status: '404' },
        'grouped-column': { status: '404' },
        'custom-tooltips': { status: '404' },
        'custom-marker-shapes': { status: '404' },
        'cross-lines': { status: '404' },
        'chart-customisation': { status: '404' },
        'bubble-with-labels': { status: '404' },
        'bubble-with-custom-markers': { status: '404' },
        'box-plot-scatter-combination': { status: '404' },
        'bar-with-labels': { status: '404' },
        'bar-series-error-bars': { status: '404' },
        '100--stacked-column': { status: '404' },
        '100--stacked-bar': { status: '404' },
    },

    'axes-labels': {
        // Too complex to test with a naive button-click sweep
        'axis-label-rotation': { skipCanvasUpdateCheck: true },
    },
    'api-create-update': {
        // No framework examples
        'update-partial': { frameworks: ['vanilla', 'typescript'] },
        // No framework examples, stop button does not cause visible change
        'wait-for-update': {
            frameworks: ['vanilla', 'typescript'],
            skipCanvasUpdateCheck: true,
        },
    },
    events: {
        // Buttons have no visible rendering change
        'interaction-ranges': { skipCanvasUpdateCheck: true },
    },
    'financial-chart-types': {
        'toggle-financial-features': { clickOrder: 'reverse' },
    },
    legend: {
        'legend-position': { clickOrder: 'reverse' },
    },
    'range-bar-series': {
        // Warns for missing data
        'range-bar-missing-data': { ignoreConsoleWarnings: true },
    },
    'sankey-series': {
        alignment: { clickOrder: 'reverse' },
    },
    themes: {
        'stock-themes': { clickOrder: 'reverse' },
        // The canvas element changes, and we don't currently have a way to handle this
        'advanced-theme': { frameworks: [] },
    },
    tooltips: {
        // Buttons have no visible rendering change
        'interaction-range': { skipCanvasUpdateCheck: true },
    },
};

function convertPageUrls(path: string) {
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
    } = {
        ...exampleOptions[page]?.['*'],
        ...exampleOptions[page]?.[example],
    };

    return pages
        .filter((r) => frameworks?.includes(r.framework) !== false)
        .map(
            ({ url, example, framework }): ExampleOptions => ({
                pagePath,
                url,
                example,
                framework,
                status,
                clickOrder,
                skipCanvasUpdateCheck,
                ignoreConsoleWarnings,
            })
        );
}

test.describe('examples', () => {
    const config = setupIntrinsicAssertions();

    const examples = getExamples();

    for (const { path, affected } of examples) {
        for (const opts of convertPageUrls(path)) {
            const {
                url,
                status,
                framework,
                pagePath,
                example,
                clickOrder,
                skipCanvasUpdateCheck,
                ignoreConsoleWarnings,
            } = opts;

            test.describe(`Framework: ${framework}`, () => {
                test.describe(`Example ${pagePath}: ${example}`, () => {
                    if (status === 'ok') {
                        test(`should load ${url}`, async ({ page }) => {
                            config.ignoreConsoleWarnings = ignoreConsoleWarnings;

                            test.skip(!affected, 'unaffected example');

                            // Load example and wait for things to settle.
                            await gotoExample(page, url);

                            // Check we're dealing with a single canvas, otherwise things get tricky!
                            const canvases = await page.locator('.ag-charts-wrapper').all();
                            if (canvases.length > 1) return;
                            const canvas = canvases[0];

                            // Try pressing the buttons to see if any errors are thrown.
                            const buttons = await page.locator('.toolPanel > button').all();
                            if (clickOrder === 'reverse') buttons.reverse();

                            for (const button of buttons) {
                                const sceneRenderCount = Number(await canvas.getAttribute('data-scene-renders'));

                                await button.click();

                                if (!skipCanvasUpdateCheck) {
                                    await expect
                                        .configure({
                                            message: `Pressing button ${await button.textContent()}`,
                                        })
                                        .poll(async () => Number(await canvas.getAttribute('data-scene-renders')))
                                        .toBeGreaterThan(sceneRenderCount);
                                } else {
                                    await page.waitForLoadState('networkidle');
                                }
                            }
                        });
                    }

                    if (status === '404') {
                        test(`should 404 on ${url}`, async ({ page }) => {
                            test.skip(!affected, 'unaffected example');

                            config.ignore404s = true;
                            await page.goto(url);
                            expect(await page.title()).toMatch(/Page Not Found/);
                        });
                    }
                });
            });
        }
    }
});
