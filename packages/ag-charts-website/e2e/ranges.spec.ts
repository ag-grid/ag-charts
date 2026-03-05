import { expect, test } from './fixture';
import { gotoExample, locateCanvas, setupIntrinsicAssertions, toExamplePageUrl } from './util';

test.describe('range buttons', () => {
    setupIntrinsicAssertions(test);

    test('default buttons', async ({ page }) => {
        const { url } = toExamplePageUrl('range-buttons', 'range-buttons', 'vanilla');
        await gotoExample(page, url);
        await expect(page.locator('.ag-charts-range-buttons')).toHaveScreenshot(
            'range-buttons-default-range-buttons.png'
        );
    });

    test('custom buttons', async ({ page }) => {
        const { url } = toExamplePageUrl('range-buttons', 'custom-range-buttons', 'vanilla');
        await gotoExample(page, url);
        await expect(page.locator('.ag-charts-range-buttons')).toHaveScreenshot(
            'range-buttons-custom-range-buttons.png'
        );
    });

    test('category axis', async ({ page }) => {
        const { url } = toExamplePageUrl('range-buttons-test', 'e2e-category-range-buttons', 'vanilla');
        await gotoExample(page, url);

        const { canvas } = await locateCanvas(page);

        await page.getByText('Young Adults').click();
        await expect(canvas).toHaveScreenshot('range-buttons-category-axis.png');
    });

    test('actions', async ({ page }) => {
        const { url } = toExamplePageUrl('range-buttons-test', 'e2e-range-buttons', 'vanilla');
        await gotoExample(page, url);

        const { canvas } = await locateCanvas(page);

        await page.getByText('3 Months (number)').click();
        await expect(canvas).toHaveScreenshot('range-buttons-actions-number.png');

        await page.getByText('3 Months (calendar)').click();
        await expect(canvas).toHaveScreenshot('range-buttons-actions-calendar.png');

        await page.getByText('Value Pair').click();
        await expect(canvas).toHaveScreenshot('range-buttons-actions-value-pair.png');

        await page.getByText('All Domain Function').click();
        await expect(canvas).toHaveScreenshot('range-buttons-actions-all-domain-function.png');

        // Zoom in a few times so the visible window does not end at the end of the domain.
        await page.mouse.click(100, 100);
        await page.keyboard.type('+');
        await page.keyboard.type('+');
        await page.keyboard.type('+');
        await page.keyboard.type('+');

        await page.getByText('Visible Window Function').click();
        await expect(canvas).toHaveScreenshot('range-buttons-actions-visible-window-function.png');
    });
});
