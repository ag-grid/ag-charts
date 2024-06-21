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

function convertPageUrls(path: string) {
    const astroPath = path.split('content/').at(1)!;
    const [pagePath, examplePath] = astroPath.split('/_examples/');
    const example = examplePath.replace(/\/[a-zA-Z-]+\.ts$/, '');

    let status: 'ok' | 'skip' | '404' = 'ok';
    if (pagePath === 'gallery') {
        if (notServedGalleryExamples.includes(example)) {
            status = '404';
        }

        return toGalleryPageUrls(example).map((r) => ({ ...r, status, pagePath }));
    }
    const page = pagePath.replace(/^docs\//, '');

    if (ignorePages.some((m) => (typeof m === 'string' ? m === page : m.test(page)))) {
        status = 'skip';
    }

    return toExamplePageUrls(page, example).map((r) => ({ ...r, status, pagePath }));
}

test.describe('examples', () => {
    const config = setupIntrinsicAssertions();

    let examples = glob.glob.sync('./src/content/**/_examples/*/main.ts');
    if (process.env.NX_BASE) {
        const changedFiles = new Set(
            execSync(`git diff --name-only latest -- ./src/content/`)
                .toString()
                .split('\n')
                .map((v) => v.replace(/^packages\/ag-charts-website\//, './'))
        );
        examples = examples.filter((e) => changedFiles.has(e));

        // eslint-disable-next-line no-console
        console.warn(`NX_BASE set - applied changed example processing, ${examples.length} changed examples found.`);
    }

    for (const example of examples) {
        const testUrls = convertPageUrls(example);
        for (const { url, status, fw, pagePath, example: exampleName } of testUrls) {
            test.describe(`Framework: ${fw}`, () => {
                test.describe(`Example ${pagePath}: ${exampleName}`, () => {
                    if (status === 'ok') {
                        test(`should load ${url}`, async ({ page }) => {
                            await gotoExample(page, url);
                        });
                    }

                    if (status === '404') {
                        test(`should 404 on ${url}`, async ({ page }) => {
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
