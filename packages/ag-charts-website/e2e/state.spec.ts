import type { Page } from '@playwright/test';

import { expect, test } from './fixture';
import { SELECTORS, gotoExample, locateCanvas, setupIntrinsicAssertions, toExamplePageUrl } from './util';

test.describe('state', () => {
    setupIntrinsicAssertions(test);

    test('legend and zoom', async ({ page }) => {
        const { url } = toExamplePageUrl('api-state-test', 'legend-zoom-e2e', 'vanilla');

        await gotoExample(page, url);

        const legendItems = await page.locator(SELECTORS.legendItems).all();
        const bbox0 = await legendItems[0].boundingBox();
        if (!bbox0) throw new Error('Legend item not found');

        await page.mouse.click(bbox0.x, bbox0.y);
        await page.locator('.example-controls button').getByText('Save').click();
        await expect(page).toHaveScreenshot('state-legend-zoom-1-saved.png', { animations: 'disabled' });

        await page.locator('.example-controls button').getByText('Reload').click();
        await expect(page).toHaveScreenshot('state-legend-zoom-1-reloaded.png', { animations: 'disabled' });

        await page.locator('.example-controls button').getByText('Restore').click();
        await expect(page).toHaveScreenshot('state-legend-zoom-1-restored.png', { animations: 'disabled' });
    });

    test.describe('active', () => {
        test.describe('line-example', () => {
            async function pickDatum(page: Page, datum: { country: string; year: string }): Promise<void> {
                await page.selectOption('#myCountry', datum.country);
                await page.selectOption('#myYear', datum.year);
                await page.click('#mySetState');
            }

            async function hoverInCenter(page: Page): Promise<void> {
                const { width, height } = await locateCanvas(page);
                await page.mouse.move(width / 2, height / 2);
            }

            async function hoverInTopLeft(page: Page): Promise<void> {
                await page.mouse.move(20, 20);
            }

            function expectCanvas(page: Page) {
                return expect(page.locator(SELECTORS.canvasCenter));
            }

            test.beforeEach(async ({ page }) => {
                await gotoExample(page, toExamplePageUrl('picked', 'line-example', 'vanilla').url);
            });

            test('3 setState calls', async ({ page }) => {
                await expectCanvas(page).toHaveScreenshot('line-example-canvas-inactive.png');

                await pickDatum(page, { country: 'Spain', year: '2010' });
                await expect(page).toHaveScreenshot('line-example-page-active-Spain-2010.png');

                await pickDatum(page, { country: 'France', year: '2014' });
                await expect(page).toHaveScreenshot('line-example-page-active-France-2014.png');

                await pickDatum(page, { country: 'UK', year: '2023' });
                await expect(page).toHaveScreenshot('line-example-page-active-UK-2023.png');
            });

            test('hover events clear unfrozen setState', async ({ page }) => {
                await pickDatum(page, { country: 'UK', year: '2023' });
                await expect(page).toHaveScreenshot('line-example-page-active-UK-2023.png');

                await hoverInCenter(page);
                await expectCanvas(page).toHaveScreenshot('line-example-canvas-hover-center.png');

                await hoverInTopLeft(page);
                await expectCanvas(page).toHaveScreenshot('line-example-canvas-inactive.png');
            });
        });
    });
});
