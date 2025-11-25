import { expect, test } from './fixture';
import {
    SELECTORS,
    canvasToPageTransformer,
    gotoExample,
    locateCanvas,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    toExamplePageUrls,
} from './util';

test.describe('context-menu', () => {
    setupIntrinsicAssertions(test);

    for (const { framework, url } of toExamplePageUrls('zoom', 'zoom-min-visible-items')) {
        test.describe(`for ${framework}`, () => {
            test('zoom and pan', async ({ page }) => {
                await gotoExample(page, url);

                const { width, height } = await locateCanvas(page);
                const point = await canvasToPageTransformer(page);
                let p: { x: number; y: number };

                p = point(width * (2 / 3), height / 2);
                await page.mouse.click(p.x, p.y, { button: 'right' });
                await expect(page).toHaveScreenshot('zoom-contextmenu.png', { animations: 'disabled' });

                await page.locator('.ag-charts-context-menu__item').filter({ hasText: 'Zoom to here' }).click();
                await expect(page).toHaveScreenshot('zoom-to-here.png', { animations: 'disabled' });

                p = point(width / 10, height / 2);
                await page.mouse.click(p.x, p.y, { button: 'right' });

                await page.locator('.ag-charts-context-menu__item').filter({ hasText: 'Pan to here' }).click();
                await expect(page).toHaveScreenshot('pan-to-here.png', { animations: 'disabled' });

                p = point(width / 10, height / 2);
                await page.mouse.click(p.x, p.y, { button: 'right' });

                await page.locator('.ag-charts-context-menu__item').filter({ hasText: 'Reset zoom' }).click();
                await expect(page).toHaveScreenshot('reset-zoom.png', { animations: 'disabled' });
            });
        });
    }

    for (const { framework, url } of toExamplePageUrls('context-menu', 'context-menu-actions')) {
        test.describe(`for ${framework}`, () => {
            test('items update', async ({ page }) => {
                await gotoExample(page, url);
                const point = await canvasToPageTransformer(page);

                const title = point(400, 40);
                const seriesNodesHit = point(350, 260);
                const seriesNodesMiss = point(285, 300);
                const legendItem2 = point(460, 540);

                await page.mouse.click(title.x, title.y, { button: 'left' });
                await expect(page).toHaveScreenshot('contextmenu-left-click.png', { animations: 'disabled' });

                await page.mouse.click(seriesNodesHit.x, seriesNodesHit.y, { button: 'right' });
                await expect(page).toHaveScreenshot('contextmenu-series-blue-node.png', { animations: 'disabled' });

                await page.mouse.click(legendItem2.x, legendItem2.y, { button: 'right' });
                await expect(page).toHaveScreenshot('contextmenu-legend-orange-node.png', { animations: 'disabled' });

                await page.mouse.click(title.x, title.y, { button: 'right' });
                await expect(page).toHaveScreenshot('contextmenu-title.png', { animations: 'disabled' });

                await page.mouse.click(seriesNodesMiss.x, seriesNodesMiss.y, { button: 'right' });
                await expect(page).toHaveScreenshot('contextmenu-series-no-node.png', { animations: 'disabled' });

                await page.mouse.click(legendItem2.x, legendItem2.y, { button: 'left' });
                await expect(page).toHaveScreenshot('contextmenu-legend-click.png', { animations: 'disabled' });
            });
        });
    }

    test('AG-13359 context menu on multiple charts', async ({ page }) => {
        const { url } = toExamplePageUrl('accessibility-test', 'opening-context-menu-second-chart', 'vanilla');
        await gotoExample(page, url);

        await page.mouse.click(360, 570, { button: 'right' });
        await expect(page).toHaveScreenshot('AG-13359-context-menu-chart1-legend-item.png', { animations: 'disabled' });

        await page.keyboard.press('PageDown');
        await page.keyboard.press('PageDown');
        await page.keyboard.press('PageDown');

        await page.locator(SELECTORS.wrapper).nth(1).click({ button: 'right' });
        await expect(page).toHaveScreenshot('AG-13359-context-menu-chart2-series-area.png', { animations: 'disabled' });
    });

    test('no context menu items for waterfall legend', async ({ page }) => {
        const { url } = toExamplePageUrl('waterfall-series', 'simple-waterfall', 'vanilla');
        await gotoExample(page, url);

        await page.mouse.click(360, 570, { button: 'right' });
        await expect(page).toHaveScreenshot('no-context-menu-items-for-waterfall-legend.png', {
            animations: 'disabled',
        });
    });

    test('AG-16178 mouse exit and reenter', async ({ page }) => {
        const { url } = toExamplePageUrl('context-menu', 'context-menu-actions', 'vanilla');
        await gotoExample(page, url);

        await page.mouse.click(400, 300, { button: 'right' });
        const sayHello = page.getByText('Say hello', { exact: true });

        await sayHello.hover();
        await expect(page).toHaveScreenshot('AG-16178-say-hello-hovered.png');

        await page.mouse.move(0, 0);
        await expect(page).toHaveScreenshot('AG-16178-say-hello-not-hovered.png');

        await sayHello.hover();
        await expect(page).toHaveScreenshot('AG-16178-say-hello-hovered.png');
    });

    test.describe('AG-16259 showsOn', () => {
        test.beforeEach(async ({ page }) => {
            const { url } = toExamplePageUrl('context-menu-test', 'ag-16259-showOn', 'vanilla');
            await gotoExample(page, url);
        });

        const cases: [string, number, number, string][] = [
            ['chart', 212, 50, 'always,'],
            ['title', 405, 47, 'always,'],
            ['subtitle', 399, 76, 'always,'],
            ['footnote', 403, 555, 'always,'],
            ['xAxisLabel', 432, 476, 'always,'],
            ['yAxisLabel', 46, 275, 'always,'],
            ['seriesNode1', 400, 300, 'always,series-area,series-node,'],
            ['seriesNode2', 710, 350, 'always,series-area,series-node,'],
            ['seriesArea', 292, 165, 'always,series-area,'],
            ['legendItem1', 356, 521, 'always,legend-item,'],
            ['legendItem2', 460, 521, 'always,legend-item,'],
        ];

        for (const [name, x, y, expectedHtmlText] of cases) {
            test(name, async ({ page }) => {
                // Check that (x,y) coord are clicking the correct HTML element that we expect.
                const rightClickedTextContent = await page.evaluate(
                    (args) => document.elementFromPoint(args.x, args.y)?.textContent ?? '',
                    { x, y }
                );
                expect(rightClickedTextContent).toMatchSnapshot();

                await page.mouse.click(x, y, { button: 'right' });
                const actualHtmlText = await page.textContent('.ag-charts-context-menu');
                expect(actualHtmlText).toEqual(expectedHtmlText);
            });
        }
    });
});
