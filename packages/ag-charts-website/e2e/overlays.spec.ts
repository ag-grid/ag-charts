import { expect, test } from './fixture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrls, waitForAllChartUpdates } from './util';

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
