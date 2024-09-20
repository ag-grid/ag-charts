import { expect, test } from '@playwright/test';

import { SELECTORS, gotoExample, locateCanvas, setupIntrinsicAssertions, toExamplePageUrls } from './util';

test.describe('context-menu', () => {
    setupIntrinsicAssertions();

    for (const { framework, url } of toExamplePageUrls('zoom', 'zoom-min-visible-items')) {
        test.describe(`for ${framework}`, () => {
            test('zoom and pan', async ({ page }) => {
                await gotoExample(page, url);

                const { width, height } = await locateCanvas(page);

                await page.click(SELECTORS.canvas, {
                    button: 'right',
                    position: { x: width * (2 / 3), y: height / 2 },
                });
                await expect(page).toHaveScreenshot('zoom-contextmenu.png', { animations: 'disabled' });

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

    for (const { framework, url } of toExamplePageUrls('context-menu', 'context-menu-actions')) {
        test.describe(`for ${framework}`, () => {
            const title = { x: 400, y: 40 };
            const seriesNodesHit = { x: 350, y: 260 };
            const seriesNodesMiss = { x: 285, y: 300 };
            const legendItem2 = { x: 460, y: 540 };
            test('items update', async ({ page }) => {
                await gotoExample(page, url);
                const { canvas } = SELECTORS;

                await page.click(canvas, { button: 'left', position: title });
                await expect(page).toHaveScreenshot('contextmenu-left-click.png', { animations: 'disabled' });

                await page.click(canvas, { button: 'right', position: seriesNodesHit });
                await expect(page).toHaveScreenshot('contextmenu-series-blue-node.png', { animations: 'disabled' });

                await page.click(canvas, { button: 'right', position: legendItem2 });
                await expect(page).toHaveScreenshot('contextmenu-legend-orange-node.png', { animations: 'disabled' });

                await page.click(canvas, { button: 'right', position: title });
                await expect(page).toHaveScreenshot('contextmenu-title.png', { animations: 'disabled' });

                await page.click(canvas, { button: 'right', position: seriesNodesMiss });
                await expect(page).toHaveScreenshot('contextmenu-series-no-node.png', { animations: 'disabled' });

                await page.click(canvas, { button: 'left', position: legendItem2 });
                await expect(page).toHaveScreenshot('contextmenu-legend-click.png', { animations: 'disabled' });
            });
        });
    }
});
