import { Page, expect, test } from '@playwright/test';

const baseUrl = 'http://localhost:4601';
const fws = ['vanilla', 'typescript', 'reactFunctional', 'reactFunctionalTs', 'angular', 'vue3'];

export function toExamplePageUrls(page: string, example: string) {
    return fws.map((fw) => ({ fw, url: `${baseUrl}/${fw}/${page}/examples/${example}`, example }));
}

export function toGalleryPageUrls(example: string) {
    return [{ fw: 'vanilla', url: `${baseUrl}/gallery/examples/${example}`, example }];
}

export function setupIntrinsicAssertions() {
    let consoleWarnOrErrors: string[] = [];
    const config = { ignore404s: false };

    test.beforeEach(({ page }) => {
        consoleWarnOrErrors = [];
        config.ignore404s = false;

        page.on('console', (msg) => {
            // We only care about warnings/errors.
            if (msg.type() !== 'warning' && msg.type() !== 'error') return;

            // We don't care about the AG Charts license error message.
            if (msg.text().startsWith('*')) return;

            // Ignore 404s when expected
            const notFoundMatcher = /the server responded with a status of 404 \(Not Found\)/;
            if (msg.location().url.includes('/favicon.ico')) return;
            if (notFoundMatcher.test(msg.text())) {
                if (config.ignore404s) return;
                expect(`${msg.location().url} - ${msg.text()}`).not.toMatch(notFoundMatcher);
            }

            consoleWarnOrErrors.push(msg.text());
        });

        page.on('pageerror', (err) => {
            consoleWarnOrErrors.push(err.message);
        });
    });

    test.afterEach(() => {
        expect(consoleWarnOrErrors).toHaveLength(0);
    });

    return config;
}

export async function gotoExample(page: Page, url: string) {
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
    for (const elements of await page.locator('.ag-charts-wrapper').all()) {
        await expect(elements).toHaveAttribute('data-scene-renders', { timeout: 5_000 });
    }
}
