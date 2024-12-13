import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

test.describe('state', () => {
    setupIntrinsicAssertions();

    test('legend and zoom', async ({ page }) => {
        const { url } = toExamplePageUrl('api-state-test', 'legend-zoom-e2e', 'vanilla');

        await gotoExample(page, url);

        const bbox0 = await page.$(SELECTORS.legendItem0).then((legendItem0) => legendItem0?.boundingBox());
        if (!bbox0) throw new Error('Legend item not found');

        await page.mouse.click(bbox0.x, bbox0.y);
        await page.locator('.toolbar button').getByText('Save').click();
        await expect(page).toHaveScreenshot('state-legend-zoom-1-saved.png', { animations: 'disabled' });

        await page.locator('.toolbar button').getByText('Reload').click();
        await expect(page).toHaveScreenshot('state-legend-zoom-1-reloaded.png', { animations: 'disabled' });

        await page.locator('.toolbar button').getByText('Restore').click();
        await expect(page).toHaveScreenshot('state-legend-zoom-1-restored.png', { animations: 'disabled' });
    });
});
