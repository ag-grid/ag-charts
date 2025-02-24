import { Page } from '@playwright/test';

import { expect, test } from './fixture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

async function openExample(page: Page, exampleName: 'chart-click-event' | 'series-node-click-event' | 'node-click-event') {
    await gotoExample(page, toExamplePageUrl('events', exampleName, 'vanilla').url);
}

test.describe('api-events', () => {
    setupIntrinsicAssertions();

    test.describe('chart clicks', () => {
        const west = { x: 250, y: 160 };
        const east = { x: 500, y: 150 };

        test.beforeEach(async ({ page }) => {
            await openExample(page, 'chart-click-event');
        });
        test.describe('mouse', () => {
            test('click', async ({ page }) => {
                await page.mouse.click(west.x, west.y);
                await expect(page).toHaveScreenshot('click.png');

                await page.mouse.click(east.x, east.y);
                await expect(page).toHaveScreenshot('click.png');
            });
            test('doubleClick', async ({ page }) => {
                await page.mouse.click(west.x, west.y);
                await page.mouse.click(east.x, east.y);
                await expect(page).toHaveScreenshot('click.png');

                await page.mouse.dblclick(west.x, west.y);
                await expect(page).toHaveScreenshot('doubleClick.png');
            });
        });
        test.describe('touch', () => {
            test('click', async ({ page }) => {
                await page.touchscreen.tap(west.x, west.y);
                await expect(page).toHaveScreenshot('click.png');

                await page.touchscreen.tap(east.x, east.y);
                await expect(page).toHaveScreenshot('click.png');
            });
            test('doubleClick', async ({ page }) => {
                await page.touchscreen.tap(west.x, west.y);
                await page.touchscreen.tap(east.x, east.y);
                await expect(page).toHaveScreenshot('click.png');

                await page.touchscreen.tap(west.x, west.y);
                await page.touchscreen.tap(west.x, west.y);
                await expect(page).toHaveScreenshot('doubleClick.png');
            });
        });
    });
});
