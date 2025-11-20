import type { Page } from '@playwright/test';

import { test } from './fixture';
import { createConsoleLogs, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

async function openExample(
    page: Page,
    exampleName: 'chart-click-event' | 'series-node-click-event' | 'node-click-event'
) {
    await gotoExample(page, toExamplePageUrl('events', exampleName, 'vanilla').url);
}

test.describe('api-events', () => {
    const consoleLogs = createConsoleLogs();

    setupIntrinsicAssertions(test);

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
                await consoleLogs.expectMsgs([]);

                await page.mouse.click(west.x, west.y);
                await consoleLogs.expectMsgs(['[click]']);
                consoleLogs.clear();

                await page.mouse.click(east.x, east.y);
                await consoleLogs.expectMsgs(['[click]']);
            });
            test('doubleClick', async ({ page }) => {
                await page.mouse.dblclick(node.x, node.y);
                await consoleLogs.expectMsgs([]);

                await page.mouse.click(west.x, west.y);
                await page.mouse.click(east.x, east.y);
                await consoleLogs.expectMsgs(['[click]', '[click]']);
                consoleLogs.clear();

                await page.mouse.dblclick(west.x, west.y);
                await consoleLogs.expectMsgs(['[click]', '[click]', '[double click]']);
            });
        });
        test.describe('touch', () => {
            test('click', async ({ page }) => {
                await page.touchscreen.tap(node.x, node.y);
                await consoleLogs.expectMsgs([]);

                await page.touchscreen.tap(west.x, west.y);
                await consoleLogs.expectMsgs(['[click]']);
                consoleLogs.clear();

                await page.touchscreen.tap(east.x, east.y);
                await consoleLogs.expectMsgs(['[click]']);
            });
            test('doubleClick', async ({ page }) => {
                await page.touchscreen.tap(node.x, node.y);
                await page.touchscreen.tap(node.x, node.y);
                await consoleLogs.expectMsgs([]);

                await page.touchscreen.tap(west.x, west.y);
                await page.touchscreen.tap(east.x, east.y);
                await consoleLogs.expectMsgs(['[click]', '[click]']);
                consoleLogs.clear();

                await page.touchscreen.tap(west.x, west.y);
                await page.touchscreen.tap(west.x, west.y);
                await consoleLogs.expectMsgs(['[click]', '[click]', '[double click]']);
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
                await consoleLogs.expectMsgs([]);

                await page.mouse.click(aprMarker.x, aprMarker.y);
                await consoleLogs.expectMsgs(['[click]\nTemperature in April: 14.2°C\nSeries: LineSeries-1']);
                consoleLogs.clear();

                await page.mouse.click(mayBarTop.x, mayBarTop.y);
                await consoleLogs.expectMsgs(['[click]\nTemperature in May: 8.7°C\nSeries: BarSeries-1']);
                consoleLogs.clear();

                await page.mouse.click(mayBarBot.x, mayBarBot.y);
                await consoleLogs.expectMsgs(['[click]\nTemperature in May: 8.7°C\nSeries: BarSeries-1']);
            });
            test('seriesNodeDoubleClick', async ({ page }) => {
                await page.mouse.dblclick(center.x, center.y);
                await consoleLogs.expectMsgs([]);

                await page.mouse.dblclick(aprMarker.x, aprMarker.y);
                await consoleLogs.expectMsgs([
                    '[click]\nTemperature in April: 14.2°C\nSeries: LineSeries-1',
                    '[click]\nTemperature in April: 14.2°C\nSeries: LineSeries-1',
                    '[double click]\nTemperature in April: 57.56°F\nSeries: LineSeries-1',
                ]);
                consoleLogs.clear();

                await page.mouse.dblclick(mayBarTop.x, mayBarTop.y);
                await consoleLogs.expectMsgs([
                    '[click]\nTemperature in May: 8.7°C\nSeries: BarSeries-1',
                    '[click]\nTemperature in May: 8.7°C\nSeries: BarSeries-1',
                    '[double click]\nTemperature in May: 47.66°F\nSeries: BarSeries-1',
                ]);
                consoleLogs.clear();

                await page.mouse.dblclick(mayBarBot.x, mayBarBot.y);
                await consoleLogs.expectMsgs([
                    '[click]\nTemperature in May: 8.7°C\nSeries: BarSeries-1',
                    '[click]\nTemperature in May: 8.7°C\nSeries: BarSeries-1',
                    '[double click]\nTemperature in May: 47.66°F\nSeries: BarSeries-1',
                ]);
            });
        });
        test.describe('touch', () => {
            test('seriesNodeClick', async ({ page }) => {
                await page.touchscreen.tap(center.x, center.y);
                await consoleLogs.expectMsgs([]);

                await page.touchscreen.tap(aprMarker.x, aprMarker.y);
                await consoleLogs.expectMsgs(['[click]\nTemperature in April: 14.2°C\nSeries: LineSeries-1']);
                consoleLogs.clear();

                await page.touchscreen.tap(mayBarTop.x, mayBarTop.y);
                await consoleLogs.expectMsgs(['[click]\nTemperature in May: 8.7°C\nSeries: BarSeries-1']);
                consoleLogs.clear();

                await page.touchscreen.tap(mayBarBot.x, mayBarBot.y);
                await consoleLogs.expectMsgs(['[click]\nTemperature in May: 8.7°C\nSeries: BarSeries-1']);
            });
            test('seriesNodeDoubleClick', async ({ page }) => {
                await page.touchscreen.tap(center.x, center.y);
                await page.touchscreen.tap(center.x, center.y);
                await consoleLogs.expectMsgs([]);

                await page.touchscreen.tap(aprMarker.x, aprMarker.y);
                await page.touchscreen.tap(aprMarker.x, aprMarker.y);
                await consoleLogs.expectMsgs([
                    '[click]\nTemperature in April: 14.2°C\nSeries: LineSeries-1',
                    '[click]\nTemperature in April: 14.2°C\nSeries: LineSeries-1',
                    '[double click]\nTemperature in April: 57.56°F\nSeries: LineSeries-1',
                ]);
                consoleLogs.clear();

                await page.touchscreen.tap(mayBarTop.x, mayBarTop.y);
                await page.touchscreen.tap(mayBarTop.x, mayBarTop.y);
                await consoleLogs.expectMsgs([
                    '[click]\nTemperature in May: 8.7°C\nSeries: BarSeries-1',
                    '[click]\nTemperature in May: 8.7°C\nSeries: BarSeries-1',
                    '[double click]\nTemperature in May: 47.66°F\nSeries: BarSeries-1',
                ]);
                consoleLogs.clear();

                await page.touchscreen.tap(mayBarBot.x, mayBarBot.y);
                await page.touchscreen.tap(mayBarBot.x, mayBarBot.y);
                await consoleLogs.expectMsgs([
                    '[click]\nTemperature in May: 8.7°C\nSeries: BarSeries-1',
                    '[click]\nTemperature in May: 8.7°C\nSeries: BarSeries-1',
                    '[double click]\nTemperature in May: 47.66°F\nSeries: BarSeries-1',
                ]);
                consoleLogs.clear();

                await page.touchscreen.tap(mayBarTop.x, mayBarTop.y);
                await page.touchscreen.tap(mayBarBot.x, mayBarBot.y); // Not a double click
                await consoleLogs.expectMsgs([
                    '[click]\nTemperature in May: 8.7°C\nSeries: BarSeries-1',
                    '[click]\nTemperature in May: 8.7°C\nSeries: BarSeries-1',
                ]);
            });
        });
        test.describe('keyboard', () => {
            test('seriesNodeClick', async ({ page }) => {
                await page.keyboard.press('Tab');
                await page.keyboard.press('Enter');
                await consoleLogs.expectMsgs(['[click]\nTemperature in March: 11.3°C\nSeries: LineSeries-1']);
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
                await consoleLogs.expectMsgs([]);

                await page.mouse.click(march.x, march.y);
                await consoleLogs.expectMsgs(['[click]\nCars sold in March: 25\nBMW: 10\nToyota: 15\n']);
                consoleLogs.clear();

                await page.mouse.click(mayTop.x, mayTop.y);
                await consoleLogs.expectMsgs(['[click]\nCars sold in May: 42\nNissan: 20\nToyota: 22\n']);
                consoleLogs.clear();

                await page.mouse.click(mayBot.x, mayBot.y);
                await consoleLogs.expectMsgs(['[click]\nCars sold in May: 42\nNissan: 20\nToyota: 22\n']);
            });
            test('nodeDoubleClick', async ({ page }) => {
                await page.mouse.dblclick(noClick.x, noClick.y);
                await consoleLogs.expectMsgs([]);

                await page.mouse.dblclick(march.x, march.y);
                await consoleLogs.expectMsgs([
                    '[click]\nCars sold in March: 25\nBMW: 10\nToyota: 15\n',
                    '[click]\nCars sold in March: 25\nBMW: 10\nToyota: 15\n',
                    '[double click]\nCars sold in March: 25\nBMW: 10\nToyota: 15\n',
                ]);
                consoleLogs.clear();

                await page.mouse.dblclick(mayTop.x, mayTop.y);
                await consoleLogs.expectMsgs([
                    '[click]\nCars sold in May: 42\nNissan: 20\nToyota: 22\n',
                    '[click]\nCars sold in May: 42\nNissan: 20\nToyota: 22\n',
                    '[double click]\nCars sold in May: 42\nNissan: 20\nToyota: 22\n',
                ]);
                consoleLogs.clear();

                await page.mouse.dblclick(mayBot.x, mayBot.y);
                await consoleLogs.expectMsgs([
                    '[click]\nCars sold in May: 42\nNissan: 20\nToyota: 22\n',
                    '[click]\nCars sold in May: 42\nNissan: 20\nToyota: 22\n',
                    '[double click]\nCars sold in May: 42\nNissan: 20\nToyota: 22\n',
                ]);
            });
        });
        test.describe('touch', () => {
            test('nodeClick', async ({ page }) => {
                await page.touchscreen.tap(noClick.x, noClick.y);
                await consoleLogs.expectMsgs([]);

                await page.touchscreen.tap(march.x, march.y);
                await consoleLogs.expectMsgs(['[click]\nCars sold in March: 25\nBMW: 10\nToyota: 15\n']);
                consoleLogs.clear();

                await page.touchscreen.tap(mayTop.x, mayTop.y);
                await consoleLogs.expectMsgs(['[click]\nCars sold in May: 42\nNissan: 20\nToyota: 22\n']);
                consoleLogs.clear();

                await page.touchscreen.tap(mayBot.x, mayBot.y);
                await consoleLogs.expectMsgs(['[click]\nCars sold in May: 42\nNissan: 20\nToyota: 22\n']);
            });
            test('nodeDoubleClick', async ({ page }) => {
                await page.touchscreen.tap(noClick.x, noClick.y);
                await page.touchscreen.tap(noClick.x, noClick.y);
                await consoleLogs.expectMsgs([]);

                await page.touchscreen.tap(march.x, march.y);
                await page.touchscreen.tap(march.x, march.y);
                await consoleLogs.expectMsgs([
                    '[click]\nCars sold in March: 25\nBMW: 10\nToyota: 15\n',
                    '[click]\nCars sold in March: 25\nBMW: 10\nToyota: 15\n',
                    '[double click]\nCars sold in March: 25\nBMW: 10\nToyota: 15\n',
                ]);
                consoleLogs.clear();

                await page.touchscreen.tap(mayTop.x, mayTop.y);
                await page.touchscreen.tap(mayTop.x, mayTop.y);
                await consoleLogs.expectMsgs([
                    '[click]\nCars sold in May: 42\nNissan: 20\nToyota: 22\n',
                    '[click]\nCars sold in May: 42\nNissan: 20\nToyota: 22\n',
                    '[double click]\nCars sold in May: 42\nNissan: 20\nToyota: 22\n',
                ]);
                consoleLogs.clear();

                await page.touchscreen.tap(mayBot.x, mayBot.y);
                await page.touchscreen.tap(mayBot.x, mayBot.y);
                await consoleLogs.expectMsgs([
                    '[click]\nCars sold in May: 42\nNissan: 20\nToyota: 22\n',
                    '[click]\nCars sold in May: 42\nNissan: 20\nToyota: 22\n',
                    '[double click]\nCars sold in May: 42\nNissan: 20\nToyota: 22\n',
                ]);
                consoleLogs.clear();

                await page.touchscreen.tap(mayTop.x, mayTop.y);
                await page.touchscreen.tap(mayBot.x, mayBot.y); // Not a double click
                await consoleLogs.expectMsgs([
                    '[click]\nCars sold in May: 42\nNissan: 20\nToyota: 22\n',
                    '[click]\nCars sold in May: 42\nNissan: 20\nToyota: 22\n',
                ]);
            });
        });
        test.describe('keyboard', () => {
            test('nodeClick', async ({ page }) => {
                await page.keyboard.press('Tab');
                await page.keyboard.press('Enter');
                await consoleLogs.expectMsgs(['[click]\nCars sold in March: 25\nBMW: 10\nToyota: 15\n']);
            });
        });
    });
});
