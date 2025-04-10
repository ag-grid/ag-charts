import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

test.describe('state', () => {
    setupIntrinsicAssertions();

    test('legend and zoom', async ({ page }) => {
        const { url } = toExamplePageUrl('api-state-test', 'legend-zoom-e2e', 'vanilla');

        await gotoExample(page, url);

        const legendItems = await page.locator(SELECTORS.legendItems).all();
        const bbox0 = await legendItems[0].boundingBox();
        if (!bbox0) throw new Error('Legend item not found');

        await page.mouse.click(bbox0.x, bbox0.y);
        await page.locator('.example-controls button').getByText('Save').click();
        await expect(page).toHaveScreenshot('state-legend-zoom-1-saved.png', { animations: 'disabled' });

        await page.locator('.example-controls button').getByText('Reload').click();
        await expect(page).toHaveScreenshot('state-legend-zoom-1-reloaded.png', { animations: 'disabled' });

        await page.locator('.example-controls button').getByText('Restore').click();
        await expect(page).toHaveScreenshot('state-legend-zoom-1-restored.png', { animations: 'disabled' });
    });
});
