import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrls, waitForAllChartUpdates } from './util';

test.describe('overlay textColor', () => {
    setupIntrinsicAssertions(test);

    for (const { framework, url } of toExamplePageUrls('overlays', 'no-data-themed-text')) {
        test(`overlay text inherits theme textColor (${framework})`, async ({ page }) => {
            await gotoExample(page, url);
            await waitForAllChartUpdates(page);

            const color = await page.locator('.ag-charts-no-data-overlay').evaluate((el) => getComputedStyle(el).color);
            expect(color).toBe('rgb(255, 0, 0)');
        });
    }
});

test.describe('overlay position', () => {
    setupIntrinsicAssertions(test);

    for (const { framework, url } of toExamplePageUrls('overlays', 'no-visible-series')) {
        test(`no visible series overlay stays put across a hide and re-show cycle (${framework})`, async ({ page }) => {
            await gotoExample(page, url);
            await waitForAllChartUpdates(page);

            const overlay = page.locator('.ag-charts-no-visible-series');
            const firstAppearance = await overlay.boundingBox();
            expect(firstAppearance).not.toBeNull();

            // Show a series to dismiss the overlay, then hide it again to bring the overlay back.
            const legendItem = page.locator(SELECTORS.legendItems).first();
            await legendItem.click();
            await waitForAllChartUpdates(page);
            await legendItem.click();
            await waitForAllChartUpdates(page);

            const secondAppearance = await overlay.boundingBox();
            expect(secondAppearance).not.toBeNull();
            expect(secondAppearance!.y).toBeCloseTo(firstAppearance!.y, 0);
        });
    }
});
