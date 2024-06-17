import { expect, test } from '@playwright/test';
import * as glob from 'glob';

const baseUrl = 'https://localhost:4601';
const fws = ['vanilla', 'typescript', 'reactFunctional', 'reactFunctionalTs', 'angular', 'vue3'];
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

function toPageUrls(path: string) {
    const astroPath = path.split('content/').at(1)!;
    const [pagePath, examplePath] = astroPath.split('/_examples/');
    const example = examplePath.replace(/\/[a-zA-Z-]+\.ts$/, '');

    let status: 'ok' | 'skip' | '404' = 'ok';
    if (pagePath === 'gallery') {
        if (notServedGalleryExamples.includes(example)) {
            status = '404';
        }

        return [{ fw: 'vanilla', url: `${baseUrl}/${pagePath}/examples/${example}`, status }];
    }
    const page = pagePath.replace(/^docs\//, '');

    if (ignorePages.some((m) => (typeof m === 'string' ? m === page : m.test(page)))) {
        status = 'skip';
    }

    return fws.map((fw) => ({ fw, url: `${baseUrl}/${fw}/${page}/examples/${example}`, status }));
}

test.describe('examples', () => {
    let consoleWarnOrErrors: string[];
    let ignore404s = false;

    test.beforeEach(({ page }) => {
        consoleWarnOrErrors = [];
        ignore404s = false;

        page.on('console', (msg) => {
            // We only care about warnings/errors.
            if (msg.type() !== 'warning' && msg.type() !== 'error') return;

            // We don't care about the AG Charts license error message.
            if (msg.text().startsWith('*')) return;

            // Ignore 404s when expected
            if (/the server responded with a status of 404 \(Not Found\)/.test(msg.text()) && ignore404s) return;

            consoleWarnOrErrors.push(msg.text());
        });

        page.on('pageerror', (err) => {
            consoleWarnOrErrors.push(err.message);
        });
    });

    test.afterEach(() => {
        expect(consoleWarnOrErrors).toHaveLength(0);
    });

    const examples = glob.glob.sync('./src/content/**/_examples/*/main.ts');

    for (const example of examples) {
        const testUrls = toPageUrls(example);
        for (const { url, status, fw } of testUrls) {
            test.describe(`Framework: ${fw}`, () => {
                test.describe(`Example ${example}`, () => {
                    if (status === 'ok') {
                        test(`should load ${url}`, async ({ page }) => {
                            await page.goto(url);
                            await page.waitForLoadState('domcontentloaded');

                            expect(await page.title()).not.toMatch(/Page Not Found/);

                            // Wait for synchronous JS execution to complete before we start waiting
                            // for <canvas/> to appear.
                            await page.evaluate(() => 1);
                            await expect(page.locator('canvas').first()).toBeVisible({ timeout: 10_000 });
                            for (const elements of await page.locator('canvas').all()) {
                                await expect(elements).toBeVisible();
                            }
                            await expect(page.locator('.ag-charts-wrapper').first()).toBeVisible({ timeout: 5_000 });
                            for (const elements of await page.locator('.ag-charts-wrapper').all()) {
                                await expect(elements).toHaveAttribute('data-scene-renders');
                            }
                        });
                    }

                    if (status === '404') {
                        test(`should 404 on ${url}`, async ({ page }) => {
                            ignore404s = true;
                            await page.goto(url);
                            expect(await page.title()).toMatch(/Page Not Found/);
                        });
                    }
                });
            });
        }
    }
});
