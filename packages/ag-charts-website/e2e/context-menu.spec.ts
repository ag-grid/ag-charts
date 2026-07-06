import type { Page } from '@playwright/test';

import type { AgCaptionContextMenuActionEvent, AgContextMenuGetItemsParamsCaption } from 'ag-charts-community';

import { expect, test } from './fixture';
import {
    SELECTORS,
    canvasToPageTransformer,
    gotoExample,
    locateCanvas,
    setupIntrinsicAssertions,
    toExamplePageUrl,
    toExamplePageUrls,
    waitForChartUpdate,
} from './util';

async function popActions(page: Page): Promise<AgCaptionContextMenuActionEvent[]> {
    await waitForChartUpdate(page.locator(SELECTORS.wrapper));
    const actions = await page.evaluate(() => {
        const agE2E_popActions: unknown = (window as any)?.agE2E?.popActions;
        if (agE2E_popActions == null) {
            throw new Error('window.agE2E.popActions is not defined');
        } else if (typeof agE2E_popActions !== 'function') {
            throw new Error('window.agE2E.popActions is not a function');
        }
        return agE2E_popActions();
    });
    expect(Array.isArray(actions)).toBe(true);
    return actions as AgCaptionContextMenuActionEvent[];
}

async function popGetItems(page: Page): Promise<AgContextMenuGetItemsParamsCaption[]> {
    await waitForChartUpdate(page.locator(SELECTORS.wrapper));
    const getItems = await page.evaluate(() => {
        const agE2E_popGetItems: unknown = (window as any)?.agE2E?.popGetItems;
        if (agE2E_popGetItems == null) {
            throw new Error('window.agE2E.popGetItems is not defined');
        } else if (typeof agE2E_popGetItems !== 'function') {
            throw new Error('window.agE2E.popGetItems is not a function');
        }
        return agE2E_popGetItems();
    });
    expect(Array.isArray(getItems)).toBe(true);
    return getItems as AgContextMenuGetItemsParamsCaption[];
}

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

    for (const { framework, url } of toExamplePageUrls('context-menu-e2e', 'context-menu-actions')) {
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
        const { url } = toExamplePageUrl('accessibility-e2e', 'opening-context-menu-second-chart', 'vanilla');
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
        const { url } = toExamplePageUrl('context-menu-e2e', 'context-menu-actions', 'vanilla');
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
            const { url } = toExamplePageUrl('context-menu-e2e', 'ag-16259-showOn', 'vanilla');
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

    test('show context menu on activeChange preventDefault', async ({ page }) => {
        const { url } = toExamplePageUrl('context-menu-e2e', 'activeChange-preventDefault', 'vanilla');
        await gotoExample(page, url);

        await page.mouse.move(404, 265);
        await page.mouse.click(404, 265, { button: 'right' });
        await expect(page).toHaveScreenshot('context-menu-shown-on-highlighted-datum.png');
    });

    test.describe('AG-17706 showOn caption', () => {
        const POINT_TITLE = { clientX: 411, clientY: 64 };
        const POINT_SUBTITLE = { clientX: 403, clientY: 111 };
        const POINT_FOOTNOTE = { clientX: 400, clientY: 557 };

        type CaptionType = AgCaptionContextMenuActionEvent['captionType'];
        type TextType = AgCaptionContextMenuActionEvent['text'];
        const TEXT_TITLE: TextType = [
            {
                alt: 'smiley',
                height: 55,
                type: 'image',
                url: 'data:image/svg+xml;charset=utf-8;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+DQogIDxjaXJjbGUgY3g9IjEwMCIgY3k9IjEwMCIgcj0iODAiIGZpbGw9InllbGxvdyIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIzIi8+DQogIDxjaXJjbGUgY3g9IjcwIiBjeT0iODAiIHI9IjgiIGZpbGw9ImJsYWNrIi8+DQogIDxjaXJjbGUgY3g9IjEzMCIgY3k9IjgwIiByPSI4IiBmaWxsPSJibGFjayIvPg0KICA8cGF0aCBkPSJNIDYwIDEyMCBRIDEwMCAxNjAgMTQwIDEyMCIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSI0IiBmaWxsPSJ0cmFuc3BhcmVudCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+DQo8L3N2Zz4NCg==',
                width: 55,
            },
            {
                text: 'MyTitle',
                type: 'text',
                verticalAlign: 'middle',
            },
            {
                fontWeight: 'bold',
                text: 'MyStrong',
                type: 'text',
                verticalAlign: 'middle',
            },
        ];
        const TEXT_SUBTITLE: TextType = new Date(86400000);
        const TEXT_FOOTNOTE: TextType = 'MyPlaintextFootnote';

        const actionEvent = (captionType: CaptionType, text: TextType) => {
            type Rules = Omit<AgCaptionContextMenuActionEvent, 'event'> & { event: unknown };
            return { captionType, event: expect.anything(), text, type: 'captionContextMenuAction' } satisfies Rules;
        };

        const getItemsEvent = (captionType: CaptionType, text: TextType): AgContextMenuGetItemsParamsCaption => {
            return { captionType, defaultItems: ['download'], context: undefined, showOn: 'caption', text };
        };

        const rightClick = (page: Page, point: { clientX: number; clientY: number }) =>
            page.mouse.click(point.clientX, point.clientY, { button: 'right' });

        const runCaptionAction = (page: Page) =>
            page.locator('.ag-charts-context-menu__item').filter({ hasText: 'Run caption action' }).click();

        test.describe('declarative', () => {
            test.beforeEach(async ({ page }) => {
                const { url } = toExamplePageUrl('context-menu-e2e', 'captions-declarative', 'vanilla');
                await gotoExample(page, url);
            });

            test.describe('title', () => {
                test.beforeEach(async ({ page }) => {
                    await rightClick(page, POINT_TITLE);
                });
                test('screenshot', async ({ page }) => {
                    await expect(page).toHaveScreenshot('AG-17706-title-menu.png', { animations: 'disabled' });
                });
                test('action', async ({ page }) => {
                    await runCaptionAction(page);
                    expect(await popActions(page)).toEqual([actionEvent('title', TEXT_TITLE)]);
                });
            });

            test.describe('subtitle', () => {
                test.beforeEach(async ({ page }) => {
                    await rightClick(page, POINT_SUBTITLE);
                });
                test('screenshot', async ({ page }) => {
                    await expect(page).toHaveScreenshot('AG-17706-subtitle-menu.png', { animations: 'disabled' });
                });
                test('action', async ({ page }) => {
                    await runCaptionAction(page);
                    expect(await popActions(page)).toEqual([actionEvent('subtitle', TEXT_SUBTITLE)]);
                });
            });

            test.describe('footnote', () => {
                test.beforeEach(async ({ page }) => {
                    await rightClick(page, POINT_FOOTNOTE);
                });
                test('screenshot', async ({ page }) => {
                    await expect(page).toHaveScreenshot('AG-17706-footnote-menu.png', { animations: 'disabled' });
                });
                test('action', async ({ page }) => {
                    await runCaptionAction(page);
                    expect(await popActions(page)).toEqual([actionEvent('footnote', TEXT_FOOTNOTE)]);
                });
            });
        });

        test.describe('dynamic', () => {
            test.beforeEach(async ({ page }) => {
                const { url } = toExamplePageUrl('context-menu-e2e', 'captions-dynamic', 'vanilla');
                await gotoExample(page, url);
            });

            test.describe('title', () => {
                test.beforeEach(async ({ page }) => {
                    await rightClick(page, POINT_TITLE);
                });
                test('screenshot', async ({ page }) => {
                    await expect(page).toHaveScreenshot('AG-17706-title-menu.png', { animations: 'disabled' });
                });
                test('action', async ({ page }) => {
                    await runCaptionAction(page);
                    expect(await popActions(page)).toEqual([actionEvent('title', TEXT_TITLE)]);
                });
                test('getItems', async ({ page }) => {
                    expect(await popGetItems(page)).toEqual([getItemsEvent('title', TEXT_TITLE)]);
                });
            });

            test.describe('subtitle', () => {
                test.beforeEach(async ({ page }) => {
                    await rightClick(page, POINT_SUBTITLE);
                });
                test('screenshot', async ({ page }) => {
                    await expect(page).toHaveScreenshot('AG-17706-subtitle-menu.png', { animations: 'disabled' });
                });
                test('action', async ({ page }) => {
                    await runCaptionAction(page);
                    expect(await popActions(page)).toEqual([actionEvent('subtitle', TEXT_SUBTITLE)]);
                });
                test('getItems', async ({ page }) => {
                    expect(await popGetItems(page)).toEqual([getItemsEvent('subtitle', TEXT_SUBTITLE)]);
                });
            });

            test.describe('footnote', () => {
                test.beforeEach(async ({ page }) => {
                    await rightClick(page, POINT_FOOTNOTE);
                });
                test('screenshot', async ({ page }) => {
                    await expect(page).toHaveScreenshot('AG-17706-footnote-menu.png', { animations: 'disabled' });
                });
                test('action', async ({ page }) => {
                    await runCaptionAction(page);
                    expect(await popActions(page)).toEqual([actionEvent('footnote', TEXT_FOOTNOTE)]);
                });
                test('getItems', async ({ page }) => {
                    expect(await popGetItems(page)).toEqual([getItemsEvent('footnote', TEXT_FOOTNOTE)]);
                });
            });
        });
    });
});
