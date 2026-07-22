import { test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
import { SELECTORS, gotoExample, setupIntrinsicAssertions, toExamplePageUrl } from './util';

test.describe('text-navigation', () => {
    setupIntrinsicAssertions(test);
    const { url } = toExamplePageUrl('financial-charts-e2e', 'toolbar', 'vanilla');

    test('annotation-text', async ({ page }) => {
        await gotoExample(page, url);

        await page.getByTitle('Text Annotations').click();
        await page.getByText('Text').click();
        await page.click(SELECTORS.canvasProxy, { position: { x: 200, y: 200 } });

        await page.keyboard.type('Line 1');
        await page.keyboard.down('Shift');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Shift');
        await page.keyboard.type('Line 2');
        await expectChartScreenshot(page, page, 'annotation-text-init.png', { animations: 'disabled' });

        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.type('L');
        await expectChartScreenshot(page, page, 'annotation-text-arrowleft.png', { animations: 'disabled' });

        await page.keyboard.press('ArrowRight');
        await page.keyboard.type('R');
        await expectChartScreenshot(page, page, 'annotation-text-arrowright.png', { animations: 'disabled' });

        await page.keyboard.press('ArrowUp');
        await page.keyboard.type('U');
        await expectChartScreenshot(page, page, 'annotation-text-arrowup.png', { animations: 'disabled' });

        await page.keyboard.press('ArrowDown');
        await page.keyboard.type('D');
        await expectChartScreenshot(page, page, 'annotation-text-arrowdown.png', { animations: 'disabled' });
    });

    test('settings-text', async ({ page }) => {
        await gotoExample(page, url);

        await page.getByTitle('Trend Lines').click();
        await page.getByText('Horizontal Line').click();
        await page.click(SELECTORS.canvasProxy, { position: { x: 200, y: 200 } });
        await page.getByTitle('Settings').click();
        await page.getByRole('tab').getByText('Text').click();

        await page.keyboard.type('Line 1');
        await page.keyboard.down('Shift');
        await page.keyboard.press('Enter');
        await page.keyboard.up('Shift');
        await page.keyboard.type('Line 2');
        await expectChartScreenshot(page, page, 'settings-text-init.png', { animations: 'disabled' });

        await page.keyboard.press('ArrowLeft');
        await page.keyboard.press('ArrowLeft');
        await page.keyboard.type('L');
        await expectChartScreenshot(page, page, 'settings-text-arrowleft.png', { animations: 'disabled' });

        await page.keyboard.press('ArrowRight');
        await page.keyboard.type('R');
        await expectChartScreenshot(page, page, 'settings-text-arrowright.png', { animations: 'disabled' });

        await page.keyboard.press('ArrowUp');
        await page.keyboard.type('U');
        await expectChartScreenshot(page, page, 'settings-text-arrowup.png', { animations: 'disabled' });

        await page.keyboard.press('ArrowDown');
        await page.keyboard.type('D');
        await expectChartScreenshot(page, page, 'settings-text-arrowdown.png', { animations: 'disabled' });
    });
});
