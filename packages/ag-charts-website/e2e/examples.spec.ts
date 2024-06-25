import { expect, test } from '@playwright/test';
import { execSync } from 'child_process';
import * as glob from 'glob';

import { gotoExample, setupIntrinsicAssertions, toExamplePageUrls, toGalleryPageUrls } from './util';

const ignorePages = ['benchmarks', /.*-test/];
const notServedGalleryExamples = [
    'time-axis-with-irregular-intervals',
    'simple-bubble',
    'scatter-series-error-bars',
    'reversed-horizontal-bar',
    'reversed-bullet',
    'reversed-bar',
    'per-marker-customisation',
    'log-axis',
    'line-series-error-bars',
    'grouped-column',
    'custom-tooltips',
    'custom-marker-shapes',
    'cross-lines',
    'chart-customisation',
    'bubble-with-labels',
    'bubble-with-custom-markers',
    'box-plot-scatter-combination',
    'bar-with-labels',
    'bar-series-error-bars',
    '100--stacked-column',
    '100--stacked-bar',
];
const ignoreFWExamples = {
    // FW pages don't have these examples, as they make no sense.
    'api-create-update': ['update-partial', 'wait-for-update'],
};
const clickBehaviorExamples = {
    // Buttons have no visible rendering change.
    // 'api-download': { download: 'no-update' },
    events: { 'interaction-ranges': 'no-update' },
    tooltips: { 'interaction-range': 'no-update' },

    // First button is the default option, so no rendering change.
    legend: { 'legend-position': 'reverse' },
    themes: { 'stock-themes': 'reverse', 'advanced-theme': 'reverse' },

    // Too complex to test with a naive button-click sweep.
    'axis-labels': { 'axis-label-rotation': 'skip' },

    // BROKEN!!!!!!!
    'api-download': { download: 'skip' },

    // ????
    'sankey-series': { alignment: 'no-update' },
    'range-bar-series': { 'range-bar-missing-data': 'skip' },
};

function convertPageUrls(path: string) {
    const astroPath = path.split('content/').at(1)!;
    const [pagePath, examplePath] = astroPath.split('/_examples/');
    const example = examplePath.replace(/\/[a-zA-Z-]+\.ts$/, '');

    let status: 'ok' | 'skip' | '404' = 'ok';
    if (pagePath === 'gallery') {
        if (notServedGalleryExamples.includes(example)) {
            status = '404';
        }

        return toGalleryPageUrls(example).map((r) => ({
            ...r,
            status,
            pagePath,
            ignoreFWs: false,
            clickBehavior: clickBehaviorExamples['gallery']?.[example] ?? 'normal',
        }));
    }
    const page = pagePath.replace(/^docs\//, '');

    if (ignorePages.some((m) => (typeof m === 'string' ? m === page : m.test(page)))) {
        status = 'skip';
    }

    return toExamplePageUrls(page, example).map((r) => ({
        ...r,
        status,
        pagePath,
        ignoreFWs: ignoreFWExamples[page]?.includes(example) ?? false,
        clickBehavior: clickBehaviorExamples[page]?.[example] ?? 'normal',
    }));
}

test.describe('examples', () => {
    const config = setupIntrinsicAssertions();

    const examples = glob.glob.sync('./src/content/**/_examples/*/main.ts').map((e) => ({ path: e, affected: true }));
    if (process.env.NX_BASE) {
        const exampleGenChanged = execSync(
            `git diff --name-only ${process.env.NX_BASE} -- ../../plugins/ag-charts-generate-example-files/`
        )
            .toString()
            .split('\n')
            .some((t) => t.trim().length > 0);
        const changedFiles = new Set(
            execSync(`git diff --name-only ${process.env.NX_BASE} -- ./src/content/`)
                .toString()
                .split('\n')
                .map((v) => v.replace(/^packages\/ag-charts-website\//, './'))
        );
        let affectedCount = 0;
        for (const example of examples) {
            example.affected = exampleGenChanged || changedFiles.has(example.path);
            affectedCount += example.affected ? 1 : 0;
        }

        // eslint-disable-next-line no-console
        console.warn(`NX_BASE set - applied changed example processing, ${affectedCount} changed examples found.`);
    }

    for (const { path, affected } of examples) {
        for (const opts of convertPageUrls(path)) {
            const { url, status, fw, pagePath, example: exampleName, ignoreFWs, clickBehavior } = opts;

            if (ignoreFWs && fw !== 'vanilla' && fw !== 'typescript') continue;

            test.describe(`Framework: ${fw}`, () => {
                test.describe(`Example ${pagePath}: ${exampleName}`, () => {
                    if (status === 'ok') {
                        test(`should load ${url}`, async ({ page }) => {
                            test.skip(!affected, 'unaffected example');

                            // Load example and wait for things to settle.
                            await gotoExample(page, url);

                            // Check we're dealing with a single canvas, otherwise things get tricky!
                            const canvases = await page.locator('.ag-charts-wrapper').all();
                            if (canvases.length > 1) return;
                            const canvas = canvases[0];

                            // Try pressing the buttons to see if any errors are thrown.
                            if (clickBehavior === 'skip') return;
                            const buttons = await page.locator('.toolPanel > button').all();
                            if (clickBehavior === 'reverse') buttons.reverse();

                            for (const button of buttons) {
                                const sceneRenderCount = Number(await canvas.getAttribute('data-scene-renders'));

                                await button.click();

                                if (clickBehavior === 'normal') {
                                    await expect
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
