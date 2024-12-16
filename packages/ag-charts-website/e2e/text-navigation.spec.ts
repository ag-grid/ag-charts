import { expect, test } from './fixture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

test.describe('text-navigation', () => {
    setupIntrinsicAssertions();
    const { url } = toExamplePageUrl('financial-charts-test', 'e2e-toolbar', 'vanilla');

    test('annotation-text', async ({ page }) => {
        await gotoExample(page, url);

        await page.getByTitle('Text Annotations').click();
        await page.getByText('Text').click();
        await page.click(SELECTORS.canvas, { position: { x: 200, y: 200 } });

        await page.keyboard.type('Line 1');
        await page.keyboard.down('Shift');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Shift');
        await page.keyboard.type('Line 2');
        await expect(page).toHaveScreenshot('annotation-text-init.png', { animations: 'disabled' });

        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.type('L');
        await expect(page).toHaveScreenshot('annotation-text-arrowleft.png', { animations: 'disabled' });

        await page.keyboard.press('ArrowRight');
        await page.keyboard.type('R');
        await expect(page).toHaveScreenshot('annotation-text-arrowright.png', { animations: 'disabled' });

        await page.keyboard.press('ArrowUp');
        await page.keyboard.type('U');
        await expect(page).toHaveScreenshot('annotation-text-arrowup.png', { animations: 'disabled' });

        await page.keyboard.press('ArrowDown');
        await page.keyboard.type('D');
        await expect(page).toHaveScreenshot('annotation-text-arrowdown.png', { animations: 'disabled' });
    });

    test('settings-text', async ({ page }) => {
        await gotoExample(page, url);

        await page.getByTitle('Trend Lines').click();
        await page.getByText('Horizontal Line').click();
        await page.click(SELECTORS.canvas, { position: { x: 200, y: 200 } });
        await page.getByTitle('Settings').click();
        await page.getByRole('tab').getByText('Text').click();

        await page.keyboard.type('Line 1');
        await page.keyboard.down('Shift');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Shift');
        await page.keyboard.type('Line 2');
        await expect(page).toHaveScreenshot('settings-text-init.png', { animations: 'disabled' });

        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.type('L');
        await expect(page).toHaveScreenshot('settings-text-arrowleft.png', { animations: 'disabled' });

        await page.keyboard.press('ArrowRight');
        await page.keyboard.type('R');
        await expect(page).toHaveScreenshot('settings-text-arrowright.png', { animations: 'disabled' });

        await page.keyboard.press('ArrowUp');
        await page.keyboard.type('U');
        await expect(page).toHaveScreenshot('settings-text-arrowup.png', { animations: 'disabled' });

        await page.keyboard.press('ArrowDown');
        await page.keyboard.type('D');
        await expect(page).toHaveScreenshot('settings-text-arrowdown.png', { animations: 'disabled' });
    });
});
