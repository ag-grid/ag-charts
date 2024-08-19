import { expect, test } from '@playwright/test';

import { gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

test.describe('toolbar', () => {
    setupIntrinsicAssertions();

    const { url } = toExamplePageUrl('financial-charts-test', 'e2e-toolbar', 'vanilla');

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

        await page.locator('[data-popover-id="text"]').hover();
        await expect(page).toHaveScreenshot('text-2-button-hover.png', { animations: 'disabled' });

        await page.locator('[data-popover-id="text"]').click();
        await expect(page).toHaveScreenshot('text-3-button-active.png', { animations: 'disabled' });

        await page.hover('canvas', { position: { x: 200, y: 200 } });
        await page.click('canvas', { position: { x: 200, y: 200 } });
        await expect(page).toHaveScreenshot('text-4-start.png', { animations: 'disabled' });

        await page.keyboard.type('Hello, world!');
        await expect(page).toHaveScreenshot('text-5-input.png', { animations: 'disabled' });

        await page.keyboard.down('Enter');
        await expect(page).toHaveScreenshot('text-6-save.png', { animations: 'disabled' });

        // Select text annotation
        await page.hover('canvas', { position: { x: 210, y: 190 } });
        await page.click('canvas', { position: { x: 210, y: 190 } });

        await page.click('canvas', { position: { x: 210, y: 190 } });
        await page.keyboard.type(' Editing!');
        await expect(page).toHaveScreenshot('text-7-editing.png', { animations: 'disabled' });

        await page.keyboard.down('Enter');

        // Select text annotation
        await page.hover('canvas', { position: { x: 210, y: 190 } });
        await page.click('canvas', { position: { x: 210, y: 190 } });

        await page.locator('[data-toolbar-id="text-size"]').click();
        await expect(page).toHaveScreenshot('text-8-font-size-popover.png', { animations: 'disabled' });

        await page.locator('.ag-charts-menu__label', { hasText: '46' }).click();
        await expect(page).toHaveScreenshot('text-9-change-font-size.png', { animations: 'disabled' });

        await page.locator('[data-toolbar-id="delete"]').click();
        await expect(page).toHaveScreenshot('text-10-deleted.png', { animations: 'disabled' });
    });

    test('callout', async ({ page }) => {
        await gotoExample(page, url);

        await page.locator('[data-toolbar-group="annotations"][data-toolbar-id="text-menu"]').click();
        await page.locator('[data-popover-id="callout"]').click();

        await page.hover('canvas', { position: { x: 200, y: 200 } });
        await page.click('canvas', { position: { x: 200, y: 200 } });
        await expect(page).toHaveScreenshot('callout-1-start.png', { animations: 'disabled' });

        await page.hover('canvas', { position: { x: 250, y: 150 } });
        await page.click('canvas', { position: { x: 250, y: 150 } });
        await expect(page).toHaveScreenshot('callout-2-end.png', { animations: 'disabled' });

        await page.keyboard.type('Hello, world!');
        await expect(page).toHaveScreenshot('callout-3-input.png', { animations: 'disabled' });

        await page.keyboard.down('Enter');
        await expect(page).toHaveScreenshot('callout-4-save.png', { animations: 'disabled' });

        await page.hover('canvas', { position: { x: 260, y: 140 } });
        await page.click('canvas', { position: { x: 260, y: 140 } });
        await page.locator('[data-toolbar-id="fill-color"]').click();
        await expect(page).toHaveScreenshot('callout-5-fill-color-popover.png', { animations: 'disabled' });

        await page.locator('.ag-charts-color-picker__hue-input').click({
            position: {
                x: 30,
                y: 5,
            },
        });
        await page.hover('canvas', { position: { x: 100, y: 100 } });
        await page.click('canvas', { position: { x: 100, y: 100 } });
        await expect(page).toHaveScreenshot('callout-6-change-fill-color.png', { animations: 'disabled' });
    });
});
