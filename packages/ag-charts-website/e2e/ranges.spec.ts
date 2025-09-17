import { expect, test } from './fixture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

test.describe('zoom', () => {
    setupIntrinsicAssertions(test);

    test('default buttons', async ({ page }) => {
        const { url } = toExamplePageUrl('range-buttons', 'range-buttons', 'vanilla');
        await gotoExample(page, url);
        await expect(page.locator('.ag-charts-range-buttons')).toHaveScreenshot(
            'range-buttons-default-range-buttons.png',
            { animations: 'disabled' }
        );
    });

    test('custom buttons', async ({ page }) => {
        const { url } = toExamplePageUrl('range-buttons', 'custom-range-buttons', 'vanilla');
        await gotoExample(page, url);
        await expect(page.locator('.ag-charts-range-buttons')).toHaveScreenshot(
            'range-buttons-custom-range-buttons.png',
            { animations: 'disabled' }
        );
    });
});
