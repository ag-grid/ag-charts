import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

type GetPromiseReturnType<T> = T extends (...args: any[]) => Promise<infer U> ? U : never;

test.describe('axis-button', () => {
    setupIntrinsicAssertions(test);
    const { url } = toExamplePageUrl('financial-charts-configuration', 'default-configuration', 'vanilla');

    test('visibility', async ({ page }) => {
        await gotoExample(page, url);

        await page.mouse.move(400, 5);
        await expectChartScreenshot(page, page, 'axis-button-hidden.png');

        await page.mouse.move(400, 100);
        await expectChartScreenshot(page, page, 'axis-button-hover-100.png');

        await page.mouse.move(400, 200);
        await expectChartScreenshot(page, page, 'axis-button-hover-200.png');

        await page.mouse.move(400, 595);
        await expectChartScreenshot(page, page, 'axis-button-hidden.png');
    });

    test('click', async ({ page }) => {
        await gotoExample(page, url);
        const axisButton = page.locator(SELECTORS.axisButton).first();
        let bbox: GetPromiseReturnType<typeof axisButton.boundingBox>;

        await page.mouse.move(400, 100);
        bbox = await axisButton.boundingBox();
        await page.mouse.move(bbox.x, bbox.y);
        await page.mouse.click(bbox.x, bbox.y, { button: 'left' });
        await expectChartScreenshot(page, page, 'axis-button-click-1.png');

        await page.mouse.move(400, 200);
        bbox = await axisButton.boundingBox();
        await page.mouse.move(bbox.x, bbox.y);
        await page.mouse.click(bbox.x, bbox.y, { button: 'left' });
        await expectChartScreenshot(page, page, 'axis-button-click-2.png');
    });

    test('drag', async ({ page }) => {
        await gotoExample(page, url);
        const axisButton = page.locator(SELECTORS.axisButton).first();

        await page.mouse.move(400, 100);
        const bbox = await axisButton.boundingBox();
        await page.mouse.move(bbox.x, bbox.y);
        await page.mouse.down({ button: 'left' });
        await page.mouse.move(400, 200);
        await expectChartScreenshot(page, page, 'axis-button-drag.png');
    });

    for (const direction of ['up', 'down'] as const) {
        test(`stays inside the series area when the pointer moves ${direction} off the button`, async ({ page }) => {
            await gotoExample(page, url);
            const axisButton = page.locator(SELECTORS.axisButton).first();
            const bounds = await page.locator(SELECTORS.seriesAreaBounds).first().boundingBox();
            expect(bounds).not.toBeNull();
            const top = bounds!.y;
            const bottom = bounds!.y + bounds!.height;

            await page.mouse.move(400, (top + bottom) / 2);
            const start = await axisButton.boundingBox();
            expect(start).not.toBeNull();
            const x = start!.x + start!.width / 2;
            const step = direction === 'up' ? -5 : 5;
            const end = direction === 'up' ? top - 50 : bottom + 50;

            const visibleBoxes: NonNullable<typeof start>[] = [];
            for (let y = start!.y + start!.height / 2; direction === 'up' ? y >= end : y <= end; y += step) {
                await page.mouse.move(x, y);
                const box = (await axisButton.isVisible()) ? await axisButton.boundingBox() : null;
                if (box != null) visibleBoxes.push(box);
            }

            const minY = Math.min(...visibleBoxes.map((box) => box.y));
            const maxY = Math.max(...visibleBoxes.map((box) => box.y + box.height));
            expect(visibleBoxes.length).toBeGreaterThan(0);
            expect(minY).toBeGreaterThanOrEqual(top - 1);
            expect(maxY).toBeLessThanOrEqual(bottom + 1);
            const gapToEdge = direction === 'up' ? minY - top : bottom - maxY;
            expect(gapToEdge).toBeLessThanOrEqual(1);

            await expect(axisButton).toBeHidden();
            await expect(page.locator(SELECTORS.crosshairLabel).filter({ visible: true })).toHaveCount(0);
        });
    }
});
