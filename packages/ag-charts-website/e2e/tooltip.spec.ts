import { expect, test } from './fixture';
import { gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

test.describe('tooltip', () => {
    setupIntrinsicAssertions(test);

    test.beforeEach(async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('tooltips-test', 'e2e-tooltip-modes', 'vanilla').url);
    });

    test.describe('mode', () => {
        test('single', async ({ page }) => {
            await page.getByText('Single').click();
            await page.mouse.move(400, 150);
            await expect(page).toHaveScreenshot('tooltip-mode-single.png');
        });

        test('shared', async ({ page }) => {
            await page.getByText('Shared').click();
            await page.mouse.move(400, 150);
            await expect(page).toHaveScreenshot('tooltip-mode-shared.png');
        });

        test('compact', async ({ page }) => {
            await page.getByText('Compact').click();
            await page.mouse.move(400, 150);
            await expect(page).toHaveScreenshot('tooltip-mode-compact.png');
        });
    });
});
