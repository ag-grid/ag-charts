import { expect, test } from '@playwright/test';

import { dragCanvas, gotoExample, locateCanvas, setupIntrinsicAssertions, toExamplePageUrls } from './util';

test.describe('financial-charts-showcase', () => {
    setupIntrinsicAssertions();

    const testUrls = toExamplePageUrls('financial-charts', 'financial-charts-showcase');

    for (const { framework, url } of testUrls) {
        test.describe(`for ${framework}`, () => {
            test('zoom and hover', async ({ page }) => {
                await gotoExample(page, url);

                const { canvas, width, height } = await locateCanvas(page);

                // Zoom using Y-axis drag, then hover at a date where there is no visible
                // price datum.
                const x = width - 20;
                await dragCanvas(page, { x, y: height / 2 + 150 }, { x, y: 20 });
                await canvas.hover({ position: { x: width / 5, y: height / 2 } });

                // Expect that the price datum has been highlighted / snapped to, even though not
                // visible.
                await expect(page.locator('.ag-crosshair-label-content', { hasText: 'July 2022' })).toBeVisible();
                await expect(
                    page.locator('.ag-crosshair-label-content', { hasText: /[0-9]{2,3}\.[0-9]{2}/ })
                ).toBeVisible();
                await expect(canvas).toHaveScreenshot('zoom-and-hover-on-out-of-y-range-prices.png');
            });
        });
    }
});
