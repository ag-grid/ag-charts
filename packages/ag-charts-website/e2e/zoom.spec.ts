import { Page, expect, test } from '@playwright/test';

import { gotoExample, setupIntrinsicAssertions, toExamplePageUrls } from './util';

// The in-built `page.dragAndDrop()` methods do not trigger our canvas drag events
async function dragCanvas(
    page: Page,
    start: { x: number; y: number },
    end: { x: number; y: number },
    options = { steps: 4 }
) {
    await page.hover('canvas', { position: start });
    await page.mouse.down();
    await page.mouse.move(end.x - start.x, end.y - start.y, options);
    await page.mouse.up();
}

test.describe('zoom', () => {
    setupIntrinsicAssertions();

    const testUrls = toExamplePageUrls('financial-charts-configuration', 'chart-features');

    for (const { framework, url } of testUrls) {
        test.describe(`for ${framework}`, () => {
            test('with navigator mini chart', async ({ page }) => {
                await gotoExample(page, url);

                let width = 0;
                let height = 0;

                const canvas = await page.locator('canvas');
                width = Number(await canvas.getAttribute('width'));

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
