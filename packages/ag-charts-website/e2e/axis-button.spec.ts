import { test } from './fixture';
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
});
