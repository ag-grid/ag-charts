import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrls } from './util';

test.describe('keyboard-nav', () => {
    setupIntrinsicAssertions();

    const testUrls = toExamplePageUrls('accessibility', 'keyboard-navigation');

    for (const { framework, url } of testUrls) {
        test.describe(`for ${framework}`, () => {
            test('basic keyboard navigation', async ({ page }) => {
                await gotoExample(page, url);

                await page.locator('input').first().click();

                // Tab into chart, 1st series + 1st datum should be highlighted.
                await page.keyboard.press('Tab');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('1st-datum-focus.png');

                // Move to 3rd datum, then 2nd series.
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowDown');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('3rd-datum-2nd-series-focus.png');

                // Move to legend items.
                await page.keyboard.press('Tab');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('legend-focus.png');

                // Move to 2nd page of legend items.
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('legend-2nd-page-focus.png');

                // Move to page back control.
                await page.keyboard.press('Tab');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('legend-page-control-focus.png');

                // Tab outside of chart.
                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('tabbed-out-of-chart.png');

                // Tab back into chart.
                await page.keyboard.press('Shift+Tab');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('tabbed-back-into-chart.png');
            });
        });

        test.describe(`for ${framework}`, () => {
            test('AG-13051 kbm hover combo', async ({ page }) => {
                await gotoExample(page, url);

                await page.locator('input').first().click();

                await page.mouse.move(547, 310);
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(
                    '4th-datum-2nd-series-nofocus-highlight.png'
                );

                await page.mouse.click(547, 310, { button: 'left' });
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowDown');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('3rd-datum-2nd-series-focus.png');

                await page.mouse.move(547, 310);
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(
                    '3rd-datum-2nd-series-focus-4th-datum-2nd-series-highlight.png'
                );

                await page.mouse.move(613, 217);
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(
                    '3rd-datum-2nd-series-focus-nohighlight.png'
                );

                await page.keyboard.press('ArrowDown');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(
                    '3rd-datum-3rd-series-focus-highlight.png'
                );
            });
        });
    }
});
