import { expect, test } from '@playwright/test';

import { gotoExample, setupIntrinsicAssertions, toExamplePageUrls } from './util';

test.describe('toolbar', () => {
    setupIntrinsicAssertions();

    const testUrls = toExamplePageUrls('financial-charts', 'financial-charts-showcase');

    for (const { framework, url } of testUrls) {
        test.describe(`for ${framework}`, () => {
            test('annotations', async ({ page }) => {
                await gotoExample(page, url);

                await page.locator('[data-toolbar-group="annotations"][data-toolbar-value="line"]').click();
                await expect(page).toHaveScreenshot('line-annotation-1-button-active.png', { animations: 'disabled' });

                await page.hover('canvas', { position: { x: 100, y: 100 } });
                await page.click('canvas', { position: { x: 100, y: 100 } });
                await page.hover('canvas', { position: { x: 200, y: 200 } });
                await expect(page).toHaveScreenshot('line-annotation-2-drawing.png', { animations: 'disabled' });

                await page.click('canvas', { position: { x: 200, y: 200 } });
                await expect(page).toHaveScreenshot('line-annotation-3-complete.png', { animations: 'disabled' });
            });
        });
    }
});
