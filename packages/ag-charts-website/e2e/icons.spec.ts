import { expect, test } from '@playwright/test';

import { gotoExample, setupIntrinsicAssertions, toExamplePageUrls } from './util';

test.describe('icons', () => {
    setupIntrinsicAssertions();

    const testUrls = toExamplePageUrls('financial-charts-test', 'icons');

    for (const { url } of testUrls) {
        test('icons', async ({ page }) => {
            await gotoExample(page, url);

            const icons = await page.locator('.icons');
            await expect(icons).toHaveScreenshot('icons.png');
        });

        return;
    }
});
