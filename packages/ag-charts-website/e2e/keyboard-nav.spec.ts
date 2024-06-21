import { expect, test } from '@playwright/test';

import { gotoExample, setupIntrinsicAssertions, toExamplePageUrls } from './util';

test.describe('keyboard-nav', () => {
    setupIntrinsicAssertions();

    const testUrls = toExamplePageUrls('accessibility', 'keyboard-navigation');

    for (const { fw, url } of testUrls) {
        test.describe(`for ${fw}`, () => {
            test('basic keyboard navigation', async ({ page }) => {
                await gotoExample(page, url);
                page.check;

                await page.locator('input').first().click();

                // Tab into chart, 1st series + 1st datum should be highlighted.
                await page.keyboard.press('Tab');
                await expect(page.locator('.ag-charts-canvas-center')).toHaveScreenshot('1st-datum-focus.png');

                // Move to 3rd datum, then 2nd series.
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowDown');
                await expect(page.locator('.ag-charts-canvas-center')).toHaveScreenshot(
                    '3rd-datum-2nd-series-focus.png'
                );

                // Move to legend items.
                await page.keyboard.press('Tab');
                await expect(page.locator('.ag-charts-canvas-center')).toHaveScreenshot('legend-focus.png');

                // Move to 2nd page of legend items.
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await expect(page.locator('.ag-charts-canvas-center')).toHaveScreenshot('legend-2nd-page-focus.png');

                // Move to page back control.
                await page.keyboard.press('Tab');
                await expect(page.locator('.ag-charts-canvas-center')).toHaveScreenshot(
                    'legend-page-control-focus.png'
                );

                // Tab outside of chart.
                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                await expect(page.locator('.ag-charts-canvas-center')).toHaveScreenshot('tabbed-out-of-chart.png');

                // Tab back into chart.
                await page.keyboard.press('Shift+Tab');
                await expect(page.locator('.ag-charts-canvas-center')).toHaveScreenshot('tabbed-back-into-chart.png');
            });
        });
    }
});
