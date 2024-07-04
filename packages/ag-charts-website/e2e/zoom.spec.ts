import { Page, expect, test } from '@playwright/test';

import { dragCanvas, gotoExample, locateCanvas, setupIntrinsicAssertions, toExamplePageUrls } from './util';

test.describe('zoom', () => {
    setupIntrinsicAssertions();

    const testUrls = toExamplePageUrls('financial-charts-configuration', 'chart-features');

    for (const { framework, url } of testUrls) {
        test.describe(`for ${framework}`, () => {
            test('with navigator mini chart', async ({ page }) => {
                await gotoExample(page, url);

                const { canvas, width } = await locateCanvas(page);
                let height = 0;
                const updateCanvasSize = async () => {
                    height = Number(await canvas.getAttribute('height'));
                };

                await updateCanvasSize();
                await dragCanvas(page, { x: width - 30, y: (height * 3) / 4 }, { x: width - 30, y: height / 4 });
                await expect(page).toHaveScreenshot('before-navigator-drag-y-axis.png', { animations: 'disabled' });

                // Show navigator with minichart
                await page.locator('.toolbar button').getByText('Toggle Navigator').click();
                await updateCanvasSize();

                await dragCanvas(page, { x: width - 30, y: (height * 3) / 4 }, { x: width - 30, y: height / 4 });
                await expect(page).toHaveScreenshot('with-navigator-drag-y-axis.png', { animations: 'disabled' });

                await dragCanvas(page, { x: (width * 3) / 4, y: height - 100 }, { x: width / 4, y: height - 100 });
                await expect(page).toHaveScreenshot('with-navigator-drag-x-axis.png', { animations: 'disabled' });

                // Hide navigator
                await page.locator('.toolbar button').getByText('Toggle Navigator').click();
                await updateCanvasSize();

                await dragCanvas(page, { x: width - 30, y: height / 4 }, { x: width - 30, y: (height * 3) / 4 });
                await expect(page).toHaveScreenshot('after-navigator-drag-y-axis.png', { animations: 'disabled' });

                await dragCanvas(page, { x: width / 4, y: height - 50 }, { x: (width * 3) / 4, y: height - 50 });
                await expect(page).toHaveScreenshot('after-navigator-drag-x-axis.png', { animations: 'disabled' });
            });
        });
    }
});
