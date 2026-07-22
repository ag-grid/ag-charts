import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import { SELECTORS, canvasToPageTransformer, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

test.describe('AG-17064 tooltip position offset', () => {
    setupIntrinsicAssertions(test);

    test.beforeEach(async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('tooltips', 'tooltip-position', 'vanilla').url);
        // Select anchorTo: Node for predictable positioning
        await page.locator('select').first().selectOption('node');
    });

    async function hoverDataPoint(page: import('@playwright/test').Page) {
        const toPage = await canvasToPageTransformer(page);
        const point = toPage(400, 150);
        await page.mouse.move(point.x, point.y);
        await expect(page.locator(SELECTORS.tooltip)).toBeVisible();
    }

    test('default offset', async ({ page }) => {
        await page.locator('select').nth(1).selectOption('right');
        await hoverDataPoint(page);
        await expectChartScreenshot(page, page, 'tooltip-offset-default.png');
    });

    test('large offset', async ({ page }) => {
        await page.locator('select').nth(1).selectOption('right');
        await page.locator('#offsetSlider').fill('30');
        await page.locator('#offsetSlider').dispatchEvent('input');
        await hoverDataPoint(page);
        await expectChartScreenshot(page, page, 'tooltip-offset-large.png');
    });

    test('zero offset', async ({ page }) => {
        await page.locator('select').nth(1).selectOption('top');
        await page.locator('#offsetSlider').fill('0');
        await page.locator('#offsetSlider').dispatchEvent('input');
        await hoverDataPoint(page);
        await expectChartScreenshot(page, page, 'tooltip-offset-zero.png');
    });

    test('offset does not suppress arrow', async ({ page }) => {
        await page.locator('select').nth(1).selectOption('top');
        await page.locator('#offsetSlider').fill('20');
        await page.locator('#offsetSlider').dispatchEvent('input');
        await hoverDataPoint(page);
        // Arrow should be visible with offset only (no xOffset/yOffset)
        const tooltip = page.locator(SELECTORS.tooltip);
        await expect(tooltip).toBeVisible();
        await expectChartScreenshot(page, page, 'tooltip-offset-arrow-visible.png');
    });
});
