import { expect, test } from './fixture';
import {
    SELECTORS,
    canvasToPageTransformer,
    gotoExample,
    locateCanvas,
    setupIntrinsicAssertions,
    toExamplePageUrl,
} from './util';

test.describe('rtl', () => {
    setupIntrinsicAssertions(test);

    test('basic RTL bar chart rendering', async ({ page }) => {
        const { url } = toExamplePageUrl('rtl-test', 'rtl-bar-chart', 'vanilla');
        await gotoExample(page, url);
        await expect(page).toHaveScreenshot('rtl-bar-chart.png', { animations: 'disabled' });
    });

    test('captions and BiDi wrapping', async ({ page }) => {
        const { url } = toExamplePageUrl('rtl-test', 'rtl-captions-bidi', 'vanilla');
        await gotoExample(page, url);
        await expect(page).toHaveScreenshot('rtl-captions-bidi.png', { animations: 'disabled' });
    });

    test.describe('context menu', () => {
        test.beforeEach(async ({ page }) => {
            const { url } = toExamplePageUrl('rtl-test', 'rtl-context-menu', 'vanilla');
            await gotoExample(page, url);
        });

        test('context menu opens with Hebrew items', async ({ page }) => {
            const { width, height } = await locateCanvas(page);
            const point = await canvasToPageTransformer(page);

            const p = point(width / 2, height / 2);
            await page.mouse.click(p.x, p.y, { button: 'right' });
            await expect(page).toHaveScreenshot('rtl-context-menu-open.png', { animations: 'disabled' });
        });

        test('submenu level 1 expands leftward', async ({ page }) => {
            const { width, height } = await locateCanvas(page);
            const point = await canvasToPageTransformer(page);

            const p = point(width / 2, height / 2);
            await page.mouse.click(p.x, p.y, { button: 'right' });

            const submenuParent = page
                .locator('.ag-charts-context-menu__item')
                .filter({ hasText: 'מכירות Sales מוצרים' });
            await submenuParent.hover();
            await expect(page).toHaveScreenshot('rtl-submenu-level1.png', { animations: 'disabled' });
        });

        test('submenu level 2 (3-level cascade)', async ({ page }) => {
            const { width, height } = await locateCanvas(page);
            const point = await canvasToPageTransformer(page);

            const p = point(width / 2, height / 2);
            await page.mouse.click(p.x, p.y, { button: 'right' });

            const level1Parent = page
                .locator('.ag-charts-context-menu__item')
                .filter({ hasText: 'מכירות Sales מוצרים' });
            await level1Parent.hover();

            const level2Parent = page.locator('.ag-charts-context-menu__item').filter({ hasText: 'מכירות Q1 2024' });
            await level2Parent.hover();
            await expect(page).toHaveScreenshot('rtl-submenu-level2.png', { animations: 'disabled' });
        });

        test('keyboard: ArrowLeft opens submenu', async ({ page }) => {
            const { width, height } = await locateCanvas(page);
            const point = await canvasToPageTransformer(page);

            const p = point(width / 2, height / 2);
            await page.mouse.click(p.x, p.y, { button: 'right' });

            // Navigate down to the submenu parent.
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('ArrowDown');

            // ArrowLeft opens submenu in RTL.
            await page.keyboard.press('ArrowLeft');
            await expect(page).toHaveScreenshot('rtl-keyboard-arrowleft-opens.png', { animations: 'disabled' });
        });

        test('keyboard: ArrowRight closes submenu', async ({ page }) => {
            const { width, height } = await locateCanvas(page);
            const point = await canvasToPageTransformer(page);

            const p = point(width / 2, height / 2);
            await page.mouse.click(p.x, p.y, { button: 'right' });

            // Open submenu via hover.
            const submenuParent = page
                .locator('.ag-charts-context-menu__item')
                .filter({ hasText: 'מכירות Sales מוצרים' });
            await submenuParent.hover();

            // ArrowRight closes submenu in RTL.
            await page.keyboard.press('ArrowRight');
            await expect(page).toHaveScreenshot('rtl-keyboard-arrowright-closes.png', { animations: 'disabled' });
        });

        test('chevron flipped in RTL', async ({ page }) => {
            const { width, height } = await locateCanvas(page);
            const point = await canvasToPageTransformer(page);

            const p = point(width / 2, height / 2);
            await page.mouse.click(p.x, p.y, { button: 'right' });

            const chevron = page.locator('.ag-charts-icon-chevron-right').first();
            const transform = await chevron.evaluate((el) => getComputedStyle(el).transform);
            // scaleX(-1) produces a matrix with -1 in the first position.
            expect(transform).toContain('-1');

            await expect(page).toHaveScreenshot('rtl-chevron-flipped.png', { animations: 'disabled' });
        });

        test('legend context menu', async ({ page }) => {
            const { width, height } = await locateCanvas(page);
            const point = await canvasToPageTransformer(page);

            // Click in the legend area (bottom-centre of chart).
            const p = point(width / 2, height - 20);
            await page.mouse.click(p.x, p.y, { button: 'right' });
            await expect(page).toHaveScreenshot('rtl-legend-context-menu.png', { animations: 'disabled' });
        });
    });

    test.describe('financial chart toolbar', () => {
        test.beforeEach(async ({ page }) => {
            const { url } = toExamplePageUrl('rtl-test', 'rtl-financial-chart', 'vanilla');
            await gotoExample(page, url);
        });

        test('renders RTL financial chart', async ({ page }) => {
            await expect(page).toHaveScreenshot('rtl-financial-chart.png', { animations: 'disabled' });
        });

        test('toolbar trend line popover', async ({ page }) => {
            await page.getByTitle('Trend Lines').click();
            await expect(page).toHaveScreenshot('rtl-toolbar-trend-line-popover.png', { animations: 'disabled' });
        });

        test('toolbar draw trend line', async ({ page }) => {
            await page.getByTitle('Trend Lines').click();
            await page.getByText('Trend Line').click();

            await page.hover(SELECTORS.canvasProxy, { position: { x: 100, y: 100 } });
            await page.click(SELECTORS.canvasProxy, { position: { x: 100, y: 100 } });
            await page.hover(SELECTORS.canvasProxy, { position: { x: 200, y: 200 } });
            await page.click(SELECTORS.canvasProxy, { position: { x: 200, y: 200 } });
            await expect(page).toHaveScreenshot('rtl-toolbar-trend-line-drawn.png', { animations: 'disabled' });
        });

        test('toolbar text annotation', async ({ page }) => {
            await page.getByTitle('Text Annotations').click();
            await expect(page).toHaveScreenshot('rtl-toolbar-text-popover.png', { animations: 'disabled' });

            await page.getByText('Text').click();
            await page.hover(SELECTORS.canvasProxy, { position: { x: 200, y: 200 } });
            await page.click(SELECTORS.canvasProxy, { position: { x: 200, y: 200 } });
            await page.keyboard.type('Hello RTL');
            await expect(page).toHaveScreenshot('rtl-toolbar-text-input.png', { animations: 'disabled' });
        });
    });
});
