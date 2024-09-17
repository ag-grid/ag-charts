import { expect, test } from '@playwright/test';

import { SELECTORS, gotoExample, locateCanvas, setupIntrinsicAssertions, toExamplePageUrls } from './util';

test.describe('context-menu', () => {
    setupIntrinsicAssertions();

    const testUrls = toExamplePageUrls('zoom', 'zoom-min-visible-items');

    for (const { framework, url } of testUrls) {
        test.describe(`for ${framework}`, () => {
            test('zoom and pan', async ({ page }) => {
                await gotoExample(page, url);

                const { width, height } = await locateCanvas(page);

                await page.click(SELECTORS.canvas, {
                    button: 'right',
                    position: { x: width * (2 / 3), y: height / 2 },
                });
                await page.locator('.ag-chart-context-menu__item').filter({ hasText: 'Zoom to here' }).click();
                await expect(page).toHaveScreenshot('zoom-to-here.png', { animations: 'disabled' });

                await page.click(SELECTORS.canvas, {
                    button: 'right',
                    position: { x: width / 10, y: height / 2 },
                });

                await page.locator('.ag-chart-context-menu__item').filter({ hasText: 'Pan to here' }).click();
                await expect(page).toHaveScreenshot('pan-to-here.png', { animations: 'disabled' });
            });
        });
    }
});
