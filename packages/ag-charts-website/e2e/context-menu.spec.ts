import { expect, test } from '@playwright/test';

import { gotoExample, setupIntrinsicAssertions, toExamplePageUrls } from './util';

test.describe('context-menu', () => {
    setupIntrinsicAssertions();

    const testUrls = toExamplePageUrls('financial-charts', 'financial-charts-showcase');

    for (const { framework, url } of testUrls) {
        test.describe(`for ${framework}`, () => {
            test('zoom and pan', async ({ page }) => {
                await gotoExample(page, url);

                const canvas = await page.locator('canvas');
                const width = Number(await canvas.getAttribute('width'));
                const height = Number(await canvas.getAttribute('height'));

                await page.click('canvas', {
                    button: 'right',
                    position: { x: width / 2, y: height / 2 },
                });
                await page.locator('.ag-chart-context-menu__item').filter({ hasText: 'Zoom to here' }).click();
                await expect(page).toHaveScreenshot('zoom-to-here.png', { animations: 'disabled' });

                await page.click('canvas', {
                    button: 'right',
                    position: { x: width / 10, y: height / 2 },
                });

                await page.locator('.ag-chart-context-menu__item').filter({ hasText: 'Pan to here' }).click();
                await expect(page).toHaveScreenshot('pan-to-here.png', { animations: 'disabled' });
            });
        });
    }
});
