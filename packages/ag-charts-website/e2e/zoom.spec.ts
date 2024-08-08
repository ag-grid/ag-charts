import { expect, test } from '@playwright/test';

import { dragCanvas, gotoExample, locateCanvas, setupIntrinsicAssertions, toExamplePageUrl } from './util';

test.describe('zoom', () => {
    setupIntrinsicAssertions();

    const { url } = toExamplePageUrl('financial-charts-test', 'e2e-zoom-navigator', 'reactFunctionalTs');

    test('navigator', async ({ page }) => {
        await gotoExample(page, url);

        const { canvas, width } = await locateCanvas(page);
        let height = 0;
        const updateCanvasSize = async () => {
            height = Number(await canvas.getAttribute('height'));
        };

        await updateCanvasSize();

        const withoutNavigatorYAxisTop = { x: width - 30, y: height / 4 };
        const withoutNavigatorYAxisBottom = { x: width - 30, y: (height * 3) / 4 };

        const withoutNavigatorXAxisLeft = { x: width / 4, y: height - 10 };
        const withoutNavigatorXAxisRight = { x: (width * 3) / 4, y: height - 10 };

        const withNavigatorYAxisTop = { x: width - 30, y: height / 4 };
        const withNavigatorYAxisBottom = { x: width - 30, y: (height * 3) / 4 };

        const withNavigatorXAxisLeft = { x: (width * 3) / 4, y: height - 80 };
        const withNavigatorXAxisRight = { x: width / 4, y: height - 80 };

        // 1. Click the zoom-in button the floating zoom buttons
        await page.hover('canvas', { position: { x: 100, y: height - 100 } });
        const zoomIn = await page.locator('[data-toolbar-id="zoom-in"]');
        await zoomIn.click();
        await zoomIn.click();
        await zoomIn.click();
        await zoomIn.click();
        await zoomIn.click();
        await zoomIn.click();
        await expect(page).toHaveScreenshot('zoom-1-before-navigator-zoom-in.png', { animations: 'disabled' });

        // 2. Drag the y-axis with the navigator hidden to zoom in
        await dragCanvas(page, withoutNavigatorYAxisBottom, withoutNavigatorYAxisTop);
        await expect(page).toHaveScreenshot('zoom-2-before-navigator-drag-y-axis.png', { animations: 'disabled' });

        // Show navigator with minichart
        await page.locator('.toolbar button').getByText('Toggle Navigator').click();
        await updateCanvasSize();

        // 3. Drag the y-axis with the navigator visible to zoom in
        await dragCanvas(page, withNavigatorYAxisBottom, withNavigatorYAxisTop);
        await expect(page).toHaveScreenshot('zoom-3-with-navigator-drag-y-axis.png', { animations: 'disabled' });

        // 4. Drag the x-axis with the navigator visible to zoom in
        await dragCanvas(page, withNavigatorXAxisLeft, withNavigatorXAxisRight);
        await expect(page).toHaveScreenshot('zoom-4-with-navigator-drag-x-axis.png', { animations: 'disabled' });

        // Hide navigator
        await page.locator('.toolbar button').getByText('Toggle Navigator').click();
        await updateCanvasSize();

        // 5. Drag the y-axis twice with the navigator hidden again to zoom out
        await dragCanvas(page, withoutNavigatorYAxisTop, withoutNavigatorYAxisBottom);
        await dragCanvas(page, withoutNavigatorYAxisTop, withoutNavigatorYAxisBottom);
        await expect(page).toHaveScreenshot('zoom-5-after-navigator-drag-y-axis.png', { animations: 'disabled' });

        // 6. Drag the x-axis twice with the navigator hidden again to zoom out
        await dragCanvas(page, withoutNavigatorXAxisLeft, withoutNavigatorXAxisRight);
        await dragCanvas(page, withoutNavigatorXAxisLeft, withoutNavigatorXAxisRight);
        await expect(page).toHaveScreenshot('zoom-6-after-navigator-drag-x-axis.png', { animations: 'disabled' });
    });
});
