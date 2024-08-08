import { expect, test } from '@playwright/test';

import { gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

test.describe('toolbar', () => {
    setupIntrinsicAssertions();

    const { url } = toExamplePageUrl('financial-charts-test', 'e2e-toolbar', 'reactFunctionalTs');

    test('line', async ({ page }) => {
        await gotoExample(page, url);

        await page.locator('[data-toolbar-group="annotations"][data-toolbar-id="line-menu"]').click();
        await expect(page).toHaveScreenshot('line-1-popover.png', { animations: 'disabled' });

        await page.locator('[data-popover-id="line"]').click();
        await expect(page).toHaveScreenshot('line-2-button-active.png', { animations: 'disabled' });

        await page.hover('canvas', { position: { x: 100, y: 100 } });
        await page.click('canvas', { position: { x: 100, y: 100 } });
        await page.hover('canvas', { position: { x: 200, y: 200 } });
        await expect(page).toHaveScreenshot('line-3-drawing.png', { animations: 'disabled' });

        await page.click('canvas', { position: { x: 200, y: 200 } });
        await expect(page).toHaveScreenshot('line-4-complete.png', { animations: 'disabled' });
    });

    test('text', async ({ page }) => {
        await gotoExample(page, url);

        await page.locator('[data-toolbar-group="annotations"][data-toolbar-id="text-menu"]').click();
        await expect(page).toHaveScreenshot('text-1-popover.png', { animations: 'disabled' });

        await page.locator('[data-popover-id="text"]').click();
        await expect(page).toHaveScreenshot('text-2-button-active.png', { animations: 'disabled' });

        await page.hover('canvas', { position: { x: 200, y: 200 } });
        await page.click('canvas', { position: { x: 200, y: 200 } });
        await expect(page).toHaveScreenshot('text-3-start.png', { animations: 'disabled' });

        await page.keyboard.type('Hello, world!');
        await expect(page).toHaveScreenshot('text-4-input.png', { animations: 'disabled' });

        await page.keyboard.down('Enter');
        await expect(page).toHaveScreenshot('text-5-save.png', { animations: 'disabled' });

        await page.hover('canvas', { position: { x: 210, y: 190 } });
        await page.click('canvas', { position: { x: 210, y: 190 } });
        await page.locator('[data-toolbar-id="text-size"]').click();
        await expect(page).toHaveScreenshot('text-6-font-size-popover.png', { animations: 'disabled' });

        await page.locator('.ag-charts-popover__label', { hasText: '46' }).click();
        await expect(page).toHaveScreenshot('text-7-change-font-size.png', { animations: 'disabled' });
    });
});
