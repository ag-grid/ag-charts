import { expect, test } from './fixture';
import { SELECTORS, gotoExample, repeat, setupIntrinsicAssertions, toExamplePageUrl, toExamplePageUrls } from './util';

test.describe('keyboard-nav', () => {
    setupIntrinsicAssertions();

    const testUrls = toExamplePageUrls('accessibility', 'keyboard-navigation');

    for (const { framework, url } of testUrls) {
        test.describe(`for ${framework}`, () => {
            test('basic keyboard navigation', async ({ page }) => {
                await gotoExample(page, url);

                await page.locator('input').first().click();

                // Tab into chart, 1st series + 1st datum should be highlighted.
                await page.keyboard.press('Tab');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('1st-datum-focus.png');

                // Move to 3rd datum, then 2nd series.
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowDown');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('3rd-datum-2nd-series-focus.png');

                // Move to legend items.
                await page.keyboard.press('Tab');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('legend-focus.png');

                // Move to 2nd page of legend items.
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await page.keyboard.press('ArrowRight');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('legend-2nd-page-focus.png');

                // Move to page back control.
                await page.keyboard.press('Tab');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('legend-page-control-focus.png');

                // Tab outside of chart.
                await page.keyboard.press('Tab');
                await page.keyboard.press('Tab');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('tabbed-out-of-chart.png');

                // Tab back into chart.
                await page.keyboard.press('Shift+Tab');
                await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('tabbed-back-into-chart.png');
            });
        });
    }

    test('AG-13051 kbm hover combo', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('accessibility', 'keyboard-navigation', 'vanilla').url);

        await page.locator('input').first().click();

        await page.mouse.move(547, 310);
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(
            '4th-datum-2nd-series-nofocus-highlight.png'
        );

        await page.mouse.click(547, 310, { button: 'left' });
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('3rd-datum-2nd-series-focus.png');

        await page.mouse.move(547, 310);
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(
            '3rd-datum-2nd-series-focus-4th-datum-2nd-series-highlight.png'
        );

        await page.mouse.move(613, 217);
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(
            '3rd-datum-2nd-series-focus-nohighlight.png'
        );

        await page.keyboard.press('ArrowDown');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('3rd-datum-3rd-series-focus-highlight.png');

        await page.mouse.move(547, 310);
        await page.mouse.click(547, 310, { button: 'left' });
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(
            'nofocus-4th-datum-2nd-series-highlight.png'
        );

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowLeft');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('3rd-datum-3rd-series-focus-highlight.png');

        await page.mouse.click(100, 100, { button: 'left' });
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('nofocus-nohighlight.png');
    });

    test('AG-13643 legend toggling', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('line-series', 'simple-line', 'vanilla').url);

        await page.mouse.click(400, 300, { button: 'left' });

        await page.keyboard.press('Tab');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('AG-13643-legend-item-1-focused.png');

        await page.keyboard.press('Space');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('AG-13643-legend-item-1-pressed.png');

        await page.keyboard.press('Enter');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('AG-13643-legend-item-1-focused.png');

        await page.keyboard.press('NumpadEnter');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('AG-13643-legend-item-1-pressed.png');

        await page.keyboard.down('Shift');
        await page.keyboard.press('Tab');
        await page.keyboard.up('Shift');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('AG-13643-series-2-datum-1-focused.png');
    });

    test('AG-13668 panToBBox', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('accessibility-test', 'AG-13668-panToBBox', 'vanilla').url);
        await page.mouse.click(400, 300, { button: 'left' });

        repeat(5, async () => await page.keyboard.press('+'));
        await page.keyboard.press('ArrowLeft');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('AG-13668-datum-0-focused.png');

        repeat(4, async () => await page.keyboard.press('ArrowRight'));
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('AG-13668-datum-4-focused.png');

        await page.keyboard.press('ArrowRight');
        repeat(3, async () => await page.keyboard.press('ArrowLeft'));
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('AG-13668-datum-1-focused.png');
    });

    test('AG-13086 series node click / numpad enter', async ({ page }) => {
        await gotoExample(page, toExamplePageUrl('accessibility', 'keyboard-navigation', 'vanilla').url);

        let lastMessage = '';
        page.on('console', (msg) => {
            lastMessage = msg.text();
        });

        await page.locator('input').first().click();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Enter');
        expect(lastMessage).toEqual('seriesNodeClick BarSeries2-1 2017 2470');

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Space');
        expect(lastMessage).toEqual('seriesNodeClick BarSeries2-2 2018 2281');

        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('NumpadEnter');
        expect(lastMessage).toEqual('seriesNodeClick BarSeries2-3 2019 866');
    });

    test('polar chart', async ({ page }) => {
        const { url } = toExamplePageUrl('pie-series', 'simple-pie', 'vanilla');

        await gotoExample(page, url);

        await page.locator(SELECTORS.canvasCenter).first().click();

        await page.keyboard.press('ArrowLeft');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('pie-1-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('pie-2-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('pie-3-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('pie-4-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('pie-5-highlight.png');
    });

    test('topology chart', async ({ page }) => {
        const { url } = toExamplePageUrl('map-shapes', 'multiple-series', 'vanilla');

        await gotoExample(page, url);

        await page.locator(SELECTORS.canvasCenter).first().click();

        await page.keyboard.press('ArrowLeft');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('map-shape-1-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('map-shape-2-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('map-shape-3-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('map-shape-4-highlight.png');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot('map-shape-5-highlight.png');
    });

    test('hierarchy chart', async ({ page }) => {
        const { url } = toExamplePageUrl('treemap-series', 'simple-treemap', 'vanilla');

        await gotoExample(page, url);

        await page.locator(SELECTORS.canvasCenter).first().click();

        await page.keyboard.press('ArrowUp');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`treemap-group-highlight.png`);

        await page.keyboard.press('ArrowDown');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`treemap-tile-highlight.png`);
    });

    test('flow proportion chart', async ({ page }) => {
        const { url } = toExamplePageUrl('sankey-series', 'simple-sankey', 'vanilla');

        await gotoExample(page, url);

        await page.locator(SELECTORS.canvasCenter).first().click();

        await page.keyboard.press('ArrowLeft');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`sankey-node-highlight.png`);

        await page.keyboard.press('ArrowDown');
        await expect(page.locator(SELECTORS.canvasCenter)).toHaveScreenshot(`sankey-link-highlight.png`);
    });
});
