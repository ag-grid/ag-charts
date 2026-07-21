import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import {
    gotoExample,
    locateCanvas,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    waitForAllChartUpdates,
    waitForChartUpdate,
} from './util';

test.describe('range buttons', () => {
    setupIntrinsicAssertions(test);

    test('default buttons', async ({ page }) => {
        const { url } = toExamplePageUrl('range-buttons', 'range-buttons', 'vanilla');
        await gotoExample(page, url);
        await expect(page.locator('.ag-charts-range-buttons--buttons')).toHaveScreenshot(
            'range-buttons-default-range-buttons.png'
        );
    });

    test('custom buttons', async ({ page }) => {
        const { url } = toExamplePageUrl('range-buttons', 'custom-range-buttons', 'vanilla');
        await gotoExample(page, url);
        await expect(page.locator('.ag-charts-range-buttons--buttons')).toHaveScreenshot(
            'range-buttons-custom-range-buttons.png'
        );
    });

    test('category axis', async ({ page }) => {
        const { url } = toExamplePageUrl('range-buttons-e2e', 'category-range-buttons', 'vanilla');
        await gotoExample(page, url);

        const { canvas } = await locateCanvas(page);

        await page.getByText('Young Adults').click();
        await expectChartScreenshot(page, canvas, 'range-buttons-category-axis.png');
    });

    test('out of range', async ({ page }) => {
        const { url } = toExamplePageUrl('range-buttons-e2e', 'out-of-range', 'vanilla');
        await gotoExample(page, url);
        await expect(page.locator('.ag-charts-range-buttons--buttons')).toHaveScreenshot(
            'range-buttons-out-of-range.png'
        );
    });

    test('position', async ({ page }) => {
        const { url } = toExamplePageUrl('range-buttons-e2e', 'position', 'vanilla');
        await gotoExample(page, url);

        const { canvas } = await locateCanvas(page);

        await page.getByText('Top Left').click();
        await expectChartScreenshot(page, canvas, 'range-buttons-position-top-left.png');

        await page.getByText('Top', { exact: true }).click();
        await expectChartScreenshot(page, canvas, 'range-buttons-position-top.png');

        await page.getByText('Top Right').click();
        await expectChartScreenshot(page, canvas, 'range-buttons-position-top-right.png');

        await page.getByText('Bottom Left').click();
        await expectChartScreenshot(page, canvas, 'range-buttons-position-bottom-left.png');

        await page.getByText('Bottom', { exact: true }).click();
        await expectChartScreenshot(page, canvas, 'range-buttons-position-bottom.png');

        await page.getByText('Bottom Right').click();
        await expectChartScreenshot(page, canvas, 'range-buttons-position-bottom-right.png');
    });

    test('actions', async ({ page }) => {
        const { url } = toExamplePageUrl('range-buttons-e2e', 'range-buttons', 'vanilla');
        await gotoExample(page, url);

        const { canvas, wrapper } = await locateCanvas(page);

        await page.getByText('3 Months (number)').click();
        await expectChartScreenshot(page, canvas, 'range-buttons-actions-number.png');

        await page.getByText('3 Months (calendar)').click();
        await expectChartScreenshot(page, canvas, 'range-buttons-actions-calendar.png');

        await page.getByText('Value Pair').click();
        await expectChartScreenshot(page, canvas, 'range-buttons-actions-value-pair.png');

        await page.getByText('All Domain Function').click();
        await expectChartScreenshot(page, canvas, 'range-buttons-actions-all-domain-function.png');

        // Zoom in a few times so the visible window does not end at the end of the domain.
        await page.mouse.click(100, 100);
        await page.keyboard.type('+');
        await page.keyboard.type('+');
        await page.keyboard.type('+');
        await page.keyboard.type('+');

        await page.getByText('Visible Window Function').click();
        // Move the mouse off the chart area to avoid hover-state differences on
        // zoom-pan toolbar buttons, and wait for the chart animation to settle
        // before capturing the screenshot. Without these guards the forward-nav
        // button's hover/enabled transition produces a flaky 24x24 diff region.
        await page.mouse.move(0, 0);
        await waitForChartUpdate(wrapper);
        await expectChartScreenshot(page, canvas, 'range-buttons-actions-visible-window-function.png');
    });

    test('dropdown', async ({ page }) => {
        const { url } = toExamplePageUrl('range-buttons-e2e', 'dropdown', 'vanilla');
        await gotoExample(page, url);

        const { canvas } = await locateCanvas(page);

        // Swaps to the dropdown button
        await expectChartScreenshot(page, canvas, 'range-buttons-dropdown-1.png');

        // Opens the dropdown menu
        await page.getByText('Select range').click();
        await expectChartScreenshot(page, canvas, 'range-buttons-dropdown-2.png');

        // Does the action
        await page.locator('.ag-charts-menu').getByText('Young Adults').click();
        await expectChartScreenshot(page, canvas, 'range-buttons-dropdown-3.png');

        // Resets on zoom
        await page.mouse.dblclick(200, 200);
        await expectChartScreenshot(page, canvas, 'range-buttons-dropdown-4.png');
    });

    // CRT-705: Disabling and re-enabling ranges should correctly restore the button toolbar.
    test('enable/disable toggle restores buttons', async ({ page }) => {
        const { url } = toExamplePageUrl('range-buttons-e2e', 'enable-disable', 'vanilla');
        await gotoExample(page, url);

        const buttons = page.locator('.ag-charts-range-buttons--buttons');
        await expect(buttons).toBeVisible();

        // Disable ranges — buttons should disappear.
        await page.getByText('Disable Ranges').click();
        await waitForAllChartUpdates(page);
        await expect(buttons).not.toBeVisible();

        // Re-enable ranges — buttons should reappear.
        await page.getByText('Enable Ranges').click();
        await waitForAllChartUpdates(page);
        await expect(buttons).toBeVisible();
    });

    test('styles', async ({ page }) => {
        const { url } = toExamplePageUrl('range-buttons-e2e', 'styles', 'vanilla');
        await gotoExample(page, url);

        const { canvas } = await locateCanvas(page);

        await page.getByText('Theme Top').click();
        await expectChartScreenshot(page, canvas, 'range-buttons-styles-top.png');

        await page.getByText('Theme Child', { exact: true }).click();
        await expectChartScreenshot(page, canvas, 'range-buttons-styles-child.png');
    });
});
