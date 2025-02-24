import { Page } from '@playwright/test';

import { expect, test } from './fixture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

async function openExample(
    page: Page,
    exampleName: 'chart-click-event' | 'series-node-click-event' | 'node-click-event'
) {
    await gotoExample(page, toExamplePageUrl('events', exampleName, 'vanilla').url);
}

test.describe('api-events', () => {
    setupIntrinsicAssertions();

    test.describe('chart clicks', () => {
        const node = { x: 400, y: 400 }; // position of 'April' bar
        const west = { x: 250, y: 160 };
        const east = { x: 500, y: 150 };

        test.beforeEach(async ({ page }) => {
            await openExample(page, 'chart-click-event');
        });
        test.describe('mouse', () => {
            test('click', async ({ page }) => {
                await page.mouse.click(node.x, node.y);
                await expect(page).toHaveScreenshot('no-click.png');

                await page.mouse.click(west.x, west.y);
                await expect(page).toHaveScreenshot('click.png');

                await page.mouse.click(east.x, east.y);
                await expect(page).toHaveScreenshot('click.png');
            });
            test('doubleClick', async ({ page }) => {
                await page.mouse.dblclick(node.x, node.y);
                await expect(page).toHaveScreenshot('no-click.png');

                await page.mouse.click(west.x, west.y);
                await page.mouse.click(east.x, east.y);
                await expect(page).toHaveScreenshot('click.png');

                await page.mouse.dblclick(west.x, west.y);
                await expect(page).toHaveScreenshot('doubleClick.png');
            });
        });
        test.describe('touch', () => {
            test('click', async ({ page }) => {
                await page.touchscreen.tap(node.x, node.y);
                await expect(page).toHaveScreenshot('no-click.png');

                await page.touchscreen.tap(west.x, west.y);
                await expect(page).toHaveScreenshot('click.png');

                await page.touchscreen.tap(east.x, east.y);
                await expect(page).toHaveScreenshot('click.png');
            });
            test('doubleClick', async ({ page }) => {
                await page.touchscreen.tap(node.x, node.y);
                await page.touchscreen.tap(node.x, node.y);
                await expect(page).toHaveScreenshot('no-click.png');

                await page.touchscreen.tap(west.x, west.y);
                await page.touchscreen.tap(east.x, east.y);
                await expect(page).toHaveScreenshot('click.png');

                await page.touchscreen.tap(west.x, west.y);
                await page.touchscreen.tap(west.x, west.y);
                await expect(page).toHaveScreenshot('doubleClick.png');
            });
        });
    });

    test.describe('chart seriesNode clicks', () => {
        const center = { x: 400, y: 300 };
        const aprMarker = { x: 413, y: 226 };
        const mayBarTop = { x: 647, y: 381 };
        const mayBarBot = { x: 646, y: 506 };

        test.beforeEach(async ({ page }) => {
            await openExample(page, 'series-node-click-event');
        });
        test.describe('mouse', () => {
            test('seriesNodeClick', async ({ page }) => {
                await page.mouse.click(center.x, center.y);
                await expect(page).toHaveScreenshot('no-seriesNodeClick.png');

                await page.mouse.click(aprMarker.x, aprMarker.y);
                await expect(page).toHaveScreenshot('seriesNodeClick-marker.png');

                await page.mouse.click(mayBarTop.x, mayBarTop.y);
                await expect(page).toHaveScreenshot('seriesNodeClick-bar-top.png');

                await page.mouse.click(mayBarBot.x, mayBarBot.y);
                await expect(page).toHaveScreenshot('seriesNodeClick-bar-bot.png');
            });
            test('seriesNodeDoubleClick', async ({ page }) => {
                await page.mouse.dblclick(center.x, center.y);
                await expect(page).toHaveScreenshot('no-seriesNodeClick.png');

                await page.mouse.dblclick(aprMarker.x, aprMarker.y);
                await expect(page).toHaveScreenshot('seriesNodeDoubleClick-marker.png');

                await page.mouse.dblclick(mayBarTop.x, mayBarTop.y);
                await expect(page).toHaveScreenshot('seriesNodeDoubleClick-bar-top.png');

                await page.mouse.dblclick(mayBarBot.x, mayBarBot.y);
                await expect(page).toHaveScreenshot('seriesNodeDoubleClick-bar-bot.png');
            });
        });
        test.describe('touch', () => {
            test('seriesNodeClick', async ({ page }) => {
                await page.touchscreen.tap(center.x, center.y);
                await expect(page).toHaveScreenshot('no-seriesNodeClick.png');

                await page.touchscreen.tap(aprMarker.x, aprMarker.y);
                await expect(page).toHaveScreenshot('seriesNodeClick-marker.png');

                await page.touchscreen.tap(mayBarTop.x, mayBarTop.y);
                await expect(page).toHaveScreenshot('seriesNodeClick-bar-top.png');

                await page.touchscreen.tap(mayBarBot.x, mayBarBot.y);
                await expect(page).toHaveScreenshot('seriesNodeClick-bar-bot.png');
            });
            test('seriesNodeDoubleClick', async ({ page }) => {
                await page.touchscreen.tap(center.x, center.y);
                await page.touchscreen.tap(center.x, center.y);
                await expect(page).toHaveScreenshot('no-seriesNodeClick.png');

                await page.touchscreen.tap(aprMarker.x, aprMarker.y);
                await page.touchscreen.tap(aprMarker.x, aprMarker.y);
                await expect(page).toHaveScreenshot('seriesNodeDoubleClick-marker.png');

                await page.touchscreen.tap(mayBarTop.x, mayBarTop.y);
                await page.touchscreen.tap(mayBarTop.x, mayBarTop.y);
                await expect(page).toHaveScreenshot('seriesNodeDoubleClick-bar-top.png');

                await page.touchscreen.tap(mayBarBot.x, mayBarBot.y);
                await page.touchscreen.tap(mayBarBot.x, mayBarBot.y);
                await expect(page).toHaveScreenshot('seriesNodeDoubleClick-bar-bot.png');

                await page.touchscreen.tap(mayBarTop.x, mayBarTop.y);
                await page.touchscreen.tap(mayBarBot.x, mayBarBot.y);
                await expect(page).toHaveScreenshot('seriesNodeClick-bar-bot.png');
            });
        });
        test.describe('keyboard', () => {
            test('seriesNodeClick', async ({ page }) => {
                await page.keyboard.press('Tab');
                await page.keyboard.press('Enter');
                await expect(page).toHaveScreenshot('seriesNodeClick-keyboard.png');
            });
        });
    });

    test.describe('series nodeClicks', () => {
        const noClick = { x: 294, y: 138 };
        const march = { x: 178, y: 363 };
        const mayTop = { x: 646, y: 211 };
        const mayBot = { x: 648, y: 490 };

        test.beforeEach(async ({ page }) => {
            await openExample(page, 'node-click-event');
        });
        test.describe('mouse', () => {
            test('nodeClick', async ({ page }) => {
                await page.mouse.click(noClick.x, noClick.y);
                await expect(page).toHaveScreenshot('no-nodeClick.png');

                await page.mouse.click(march.x, march.y);
                await expect(page).toHaveScreenshot('nodeClick-march.png');

                await page.mouse.click(mayTop.x, mayTop.y);
                await expect(page).toHaveScreenshot('nodeClick-may-top.png');

                await page.mouse.click(mayBot.x, mayBot.y);
                await expect(page).toHaveScreenshot('nodeClick-may-bot.png');
            });
            test('nodeDoubleClick', async ({ page }) => {
                await page.mouse.dblclick(noClick.x, noClick.y);
                await expect(page).toHaveScreenshot('no-nodeClick.png');

                await page.mouse.dblclick(march.x, march.y);
                await expect(page).toHaveScreenshot('nodeDoubleClick-march.png');

                await page.mouse.dblclick(mayTop.x, mayTop.y);
                await expect(page).toHaveScreenshot('nodeDoubleClick-may-top.png');

                await page.mouse.dblclick(mayBot.x, mayBot.y);
                await expect(page).toHaveScreenshot('nodeDoubleClick-may-bot.png');
            });
        });
        test.describe('touch', () => {
            test('nodeClick', async ({ page }) => {
                await page.touchscreen.tap(noClick.x, noClick.y);
                await expect(page).toHaveScreenshot('no-nodeClick.png');

                await page.touchscreen.tap(march.x, march.y);
                await expect(page).toHaveScreenshot('nodeClick-march.png');

                await page.touchscreen.tap(mayTop.x, mayTop.y);
                await expect(page).toHaveScreenshot('nodeClick-may-top.png');

                await page.touchscreen.tap(mayBot.x, mayBot.y);
                await expect(page).toHaveScreenshot('nodeClick-may-bot.png');
            });
            test('nodeDoubleClick', async ({ page }) => {
                await page.touchscreen.tap(noClick.x, noClick.y);
                await page.touchscreen.tap(noClick.x, noClick.y);
                await expect(page).toHaveScreenshot('no-nodeClick.png');

                await page.touchscreen.tap(march.x, march.y);
                await page.touchscreen.tap(march.x, march.y);
                await expect(page).toHaveScreenshot('nodeDoubleClick-march.png');

                await page.touchscreen.tap(mayTop.x, mayTop.y);
                await page.touchscreen.tap(mayTop.x, mayTop.y);
                await expect(page).toHaveScreenshot('nodeDoubleClick-may-top.png');

                await page.touchscreen.tap(mayBot.x, mayBot.y);
                await page.touchscreen.tap(mayBot.x, mayBot.y);
                await expect(page).toHaveScreenshot('nodeDoubleClick-may-bot.png');

                await page.touchscreen.tap(mayTop.x, mayTop.y);
                await page.touchscreen.tap(mayBot.x, mayBot.y);
                await expect(page).toHaveScreenshot('nodeClick-may-bot.png');
            });
        });
        test.describe('keyboard', () => {
            test('nodeClick', async ({ page }) => {
                await page.keyboard.press('Tab');
                await page.keyboard.press('Enter');
                await expect(page).toHaveScreenshot('nodeClick-keyboard.png');
            });
        });
    });
});
