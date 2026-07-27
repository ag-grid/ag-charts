import type { Page } from '@playwright/test';

import type {
    AgAxisContextMenuActionEvent,
    AgAxisValue,
    AgCaptionContextMenuActionEvent,
    AgContextMenuGetItemsParamsAxis,
    AgContextMenuGetItemsParamsCaption,
    AgContextMenuGetItemsParamsCrossLine,
    AgContextMenuShowOnParamsAlways,
    AgCrossLineContextMenuActionEvent,
} from 'ag-charts-types';

import { expect, test } from './fixture';
import { expectChartScreenshot } from './scene-capture';
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

async function contextMenu(page: Page, point: { clientX: number; clientY: number }) {
    await page.mouse.click(point.clientX, point.clientY, { button: 'right' });
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
                await expectChartScreenshot(page, page, 'zoom-contextmenu.png', { animations: 'disabled' });

                await page.locator('.ag-charts-context-menu__item').filter({ hasText: 'Zoom to here' }).click();
                await expectChartScreenshot(page, page, 'zoom-to-here.png', { animations: 'disabled' });

                p = point(width / 10, height / 2);
                await page.mouse.click(p.x, p.y, { button: 'right' });

                await page.locator('.ag-charts-context-menu__item').filter({ hasText: 'Pan to here' }).click();
                await expectChartScreenshot(page, page, 'pan-to-here.png', { animations: 'disabled' });

                p = point(width / 10, height / 2);
                await page.mouse.click(p.x, p.y, { button: 'right' });

                await page.locator('.ag-charts-context-menu__item').filter({ hasText: 'Reset zoom' }).click();
                await expectChartScreenshot(page, page, 'reset-zoom.png', { animations: 'disabled' });
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
                await expectChartScreenshot(page, page, 'contextmenu-left-click.png', { animations: 'disabled' });

                await page.mouse.click(seriesNodesHit.x, seriesNodesHit.y, { button: 'right' });
                await expectChartScreenshot(page, page, 'contextmenu-series-blue-node.png', { animations: 'disabled' });

                await page.mouse.click(legendItem2.x, legendItem2.y, { button: 'right' });
                await expectChartScreenshot(page, page, 'contextmenu-legend-orange-node.png', {
                    animations: 'disabled',
                });

                await page.mouse.click(title.x, title.y, { button: 'right' });
                await expectChartScreenshot(page, page, 'contextmenu-title.png', { animations: 'disabled' });

                await page.mouse.click(seriesNodesMiss.x, seriesNodesMiss.y, { button: 'right' });
                await expectChartScreenshot(page, page, 'contextmenu-series-no-node.png', { animations: 'disabled' });

                await page.mouse.click(legendItem2.x, legendItem2.y, { button: 'left' });
                await expectChartScreenshot(page, page, 'contextmenu-legend-click.png', { animations: 'disabled' });
            });
        });
    }

    test('AG-13359 context menu on multiple charts', async ({ page }) => {
        const { url } = toExamplePageUrl('accessibility-e2e', 'opening-context-menu-second-chart', 'vanilla');
        await gotoExample(page, url);

        await page.mouse.click(360, 570, { button: 'right' });
        await expectChartScreenshot(page, page, 'AG-13359-context-menu-chart1-legend-item.png', {
            animations: 'disabled',
        });

        await page.keyboard.press('PageDown');
        await page.keyboard.press('PageDown');
        await page.keyboard.press('PageDown');

        await page.locator(SELECTORS.wrapper).nth(1).click({ button: 'right' });
        await expectChartScreenshot(page, page, 'AG-13359-context-menu-chart2-series-area.png', {
            animations: 'disabled',
        });
    });

    test('no context menu items for waterfall legend', async ({ page }) => {
        const { url } = toExamplePageUrl('waterfall-series', 'simple-waterfall', 'vanilla');
        await gotoExample(page, url);

        await page.mouse.click(360, 570, { button: 'right' });
        await expectChartScreenshot(page, page, 'no-context-menu-items-for-waterfall-legend.png', {
            animations: 'disabled',
        });
    });

    test('AG-16178 mouse exit and reenter', async ({ page }) => {
        const { url } = toExamplePageUrl('context-menu-e2e', 'context-menu-actions', 'vanilla');
        await gotoExample(page, url);

        await page.mouse.click(400, 300, { button: 'right' });
        const sayHello = page.getByText('Say hello', { exact: true });

        await sayHello.hover();
        await expectChartScreenshot(page, page, 'AG-16178-say-hello-hovered.png');

        await page.mouse.move(0, 0);
        await expectChartScreenshot(page, page, 'AG-16178-say-hello-not-hovered.png');

        await sayHello.hover();
        await expectChartScreenshot(page, page, 'AG-16178-say-hello-hovered.png');
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

    test.describe('AG-17637 overlapping regions', () => {
        async function popContextMenuText(page: Page): Promise<string | null> {
            return await page.textContent('.ag-charts-context-menu');
        }

        test.beforeEach(async ({ page }) => {
            await gotoExample(page, toExamplePageUrl('context-menu-e2e', 'ag-17637-overlap', 'vanilla').url);
        });

        test('right-clicking Mar tick label shows axis and series contexts', async ({ page }) => {
            await page.mouse.click(283, 336, { button: 'right' });
            expect(await popContextMenuText(page)).toEqual('always,axis,series-area,series-node,');
        });

        test('right-clicking top of Jun bar shows only series-area and series-node contexts', async ({ page }) => {
            await page.mouse.click(547, 133, { button: 'right' });
            expect(await popContextMenuText(page)).toEqual('always,series-area,series-node,');
        });

        test('right-clicking Apr bar on crossline shows crossline and series contexts', async ({ page }) => {
            await page.mouse.click(371, 224, { button: 'right' });
            expect(await popContextMenuText(page)).toEqual('always,crossline,series-area,series-node,');
        });

        test('right-clicking May tick label shows axis, crossline and series contexts', async ({ page }) => {
            await page.mouse.click(459, 336, { button: 'right' });
            expect(await popContextMenuText(page)).toEqual('always,axis,crossline,series-area,series-node,');
        });
    });

    test('show context menu on activeChange preventDefault', async ({ page }) => {
        const { url } = toExamplePageUrl('context-menu-e2e', 'activeChange-preventDefault', 'vanilla');
        await gotoExample(page, url);

        await page.mouse.move(404, 265);
        await page.mouse.click(404, 265, { button: 'right' });
        await expectChartScreenshot(page, page, 'context-menu-shown-on-highlighted-datum.png');
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
            return {
                captionType,
                defaultItems: ['download'],
                context: undefined,
                showOn: 'caption',
                text,
                allShowOnParams: [{ showOn: 'caption', captionType, text }],
            };
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
                    await expectChartScreenshot(page, page, 'AG-17706-title-menu.png', { animations: 'disabled' });
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
                    await expectChartScreenshot(page, page, 'AG-17706-subtitle-menu.png', { animations: 'disabled' });
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
                    await expectChartScreenshot(page, page, 'AG-17706-footnote-menu.png', { animations: 'disabled' });
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
                    await expectChartScreenshot(page, page, 'AG-17706-title-menu.png', { animations: 'disabled' });
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
                    await expectChartScreenshot(page, page, 'AG-17706-subtitle-menu.png', { animations: 'disabled' });
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
                    await expectChartScreenshot(page, page, 'AG-17706-footnote-menu.png', { animations: 'disabled' });
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

    test.describe('AG-17637 showOn axis', () => {
        const POINT_x_a = { clientX: 198, clientY: 472 } as const; // On 'Jun' tick label
        const POINT_x_b = { clientX: 621, clientY: 469 } as const; // Near (to the right) of 'Aug' tick label
        const POINT_yPrimary_a = { clientX: 67, clientY: 347 } as const; // Near '20' tick label
        const POINT_yPrimary_b = { clientX: 86, clientY: 82 } as const; // Between '60' and '80' tick labels
        const POINT_ySecondary_a = { clientX: 674, clientY: 349 } as const; // On '20M' tick label
        const POINT_ySecondary_b = { clientX: 692, clientY: 110 } as const; // Between 60M and 80M tick labels (nearer to 60M).

        type AxisParams = Omit<
            AgContextMenuGetItemsParamsAxis,
            'showOn' | 'defaultItems' | 'value' | 'index' | 'allShowOnParams'
        >;
        type PointParams = { index: number; value: AgAxisValue };

        const PARAMS_x: AxisParams = {
            axisId: 'x',
            boundSeries: [
                { key: 'x', name: undefined, seriesId: 'BarSeries-1' },
                { key: 'x', name: undefined, seriesId: 'BarSeries-2' },
            ],
            direction: 'x',
            domain: ['Jun', 'Jul', 'Aug'],
        };

        const PARAMS_yPrimary: AxisParams = {
            axisId: 'yPrimary',
            boundSeries: [{ key: 'y1', name: 'Series 1', seriesId: 'BarSeries-1' }],
            direction: 'y',
            domain: [0, 80],
        };

        const PARAMS_ySecondary: AxisParams = {
            axisId: 'ySecondary',
            boundSeries: [{ key: 'y2', name: 'Series 2', seriesId: 'BarSeries-2' }],
            direction: 'y',
            domain: [0, 80000000],
        };

        function itemsEvent(commonArg: AxisParams, pointArgs: PointParams): AgContextMenuGetItemsParamsAxis {
            return {
                showOn: 'axis',
                defaultItems: ['download'],
                ...commonArg,
                ...pointArgs,
                allShowOnParams: [{ showOn: 'axis', ...commonArg, ...pointArgs }],
            };
        }

        function actionEvent(commonArg: AxisParams, pointArgs: PointParams): AgAxisContextMenuActionEvent {
            return {
                type: 'axisContextMenuAction',
                event: expect.anything() as AgAxisContextMenuActionEvent['event'],
                ...commonArg,
                ...pointArgs,
            };
        }

        function closeTo(x: number): number {
            return expect.closeTo(x, 4) as unknown as number;
        }

        async function runAction(page: Page) {
            const button = page.getByText('Run axis action');
            await button.click();
        }

        test.beforeEach(async ({ page }) => {
            await gotoExample(page, toExamplePageUrl('context-menu-e2e', 'ag-17637-axis', 'vanilla').url);
        });

        test.describe('axis: x', () => {
            test.describe('point: a', () => {
                test.beforeEach('getItems', async ({ page }) => {
                    await contextMenu(page, POINT_x_a);
                });
                test('getItems', async ({ page }) => {
                    expect(await popGetItems(page)).toEqual([itemsEvent(PARAMS_x, { index: 0, value: 'Jun' })]);
                });
                test('actions', async ({ page }) => {
                    await runAction(page);
                    expect(await popActions(page)).toEqual([actionEvent(PARAMS_x, { index: 0, value: 'Jun' })]);
                });
            });

            test.describe('point: b', () => {
                test.beforeEach('getItems', async ({ page }) => {
                    await contextMenu(page, POINT_x_b);
                });
                test('getItems', async ({ page }) => {
                    expect(await popGetItems(page)).toEqual([itemsEvent(PARAMS_x, { index: 2, value: 'Aug' })]);
                });
                test('actions', async ({ page }) => {
                    await runAction(page);
                    expect(await popActions(page)).toEqual([actionEvent(PARAMS_x, { index: 2, value: 'Aug' })]);
                });
            });
        });

        test.describe('axis: yPrimary', () => {
            test.describe('point: a', () => {
                test.beforeEach('getItems', async ({ page }) => {
                    await contextMenu(page, POINT_yPrimary_a);
                });
                test('getItems', async ({ page }) => {
                    expect(await popGetItems(page)).toEqual([
                        itemsEvent(PARAMS_yPrimary, { index: 1, value: closeTo(19.0659) }),
                    ]);
                });
                test('actions', async ({ page }) => {
                    await runAction(page);
                    expect(await popActions(page)).toEqual([
                        actionEvent(PARAMS_yPrimary, { index: 1, value: closeTo(19.0659) }),
                    ]);
                });
            });

            test.describe('point: b', () => {
                test.beforeEach('getItems', async ({ page }) => {
                    await contextMenu(page, POINT_yPrimary_b);
                });
                test('getItems', async ({ page }) => {
                    expect(await popGetItems(page)).toEqual([
                        itemsEvent(PARAMS_yPrimary, { index: 3, value: closeTo(69.8443) }),
                    ]);
                });
                test('actions', async ({ page }) => {
                    await runAction(page);
                    expect(await popActions(page)).toEqual([
                        actionEvent(PARAMS_yPrimary, { index: 3, value: closeTo(69.8443) }),
                    ]);
                });
            });
        });

        test.describe('axis: ySecondary', () => {
            test.describe('point: a', () => {
                test.beforeEach('getItems', async ({ page }) => {
                    await contextMenu(page, POINT_ySecondary_a);
                });
                test('getItems', async ({ page }) => {
                    expect(await popGetItems(page)).toEqual([
                        itemsEvent(PARAMS_ySecondary, { index: 1, value: closeTo(18682634.7305) }),
                    ]);
                });
                test('actions', async ({ page }) => {
                    await runAction(page);
                    expect(await popActions(page)).toEqual([
                        actionEvent(PARAMS_ySecondary, { index: 1, value: closeTo(18682634.7305) }),
                    ]);
                });
            });

            test.describe('point: b', () => {
                test.beforeEach('getItems', async ({ page }) => {
                    await contextMenu(page, POINT_ySecondary_b);
                });
                test('getItems', async ({ page }) => {
                    expect(await popGetItems(page)).toEqual([
                        itemsEvent(PARAMS_ySecondary, { index: 3, value: closeTo(64479041.9162) }),
                    ]);
                });
                test('actions', async ({ page }) => {
                    await runAction(page);
                    expect(await popActions(page)).toEqual([
                        actionEvent(PARAMS_ySecondary, { index: 3, value: closeTo(64479041.9162) }),
                    ]);
                });
            });
        });
    });

    test.describe('AG-17843 showOn crossline', () => {
        type ParamKeys = 'crossLineId' | 'axisId' | 'direction' | 'crossLineType' | 'value' | 'range';
        type Params = Pick<AgCrossLineContextMenuActionEvent, ParamKeys>;

        // Crossline 1: Blue Vertical Line (x-axis)
        const PARAMS_crossline1: Params = {
            axisId: 'x',
            crossLineId: 'CrossLine-4',
            crossLineType: 'line',
            direction: 'x',
            range: undefined,
            value: 'May',
        };
        // Crossline 2: Black/Gray Vertical Range (x-axis)
        const PARAMS_crossline2: Params = {
            axisId: 'x',
            crossLineId: 'CrossLine-5',
            crossLineType: 'range',
            direction: 'x',
            range: ['Mar', 'Jun'],
            value: undefined,
        };
        // Crossline 3: Lime Horizontal Line (y-axis)
        const PARAMS_crossline3: Params = {
            axisId: 'y',
            crossLineId: 'CrossLine-6',
            crossLineType: 'line',
            direction: 'y',
            range: undefined,
            value: 8,
        };

        function itemsEvent(...expectedHits: Params[]): AgContextMenuGetItemsParamsCrossLine {
            expectedHits = expectedHits.map((hit) => ({ ...hit, showOn: 'crossline' }));
            const seriesAreaShowOnParams: AgContextMenuShowOnParamsAlways = { showOn: 'series-area' };
            return {
                ...expectedHits[0],
                allShowOnParams: [
                    ...expectedHits,
                    seriesAreaShowOnParams,
                ],
                defaultItems: ['download'],
            };
        }

        function actionEvent(...allShowOnParams: Params[]): AgCrossLineContextMenuActionEvent {
            return {
                type: 'crossLineContextMenuAction',
                event: expect.anything() as AgAxisContextMenuActionEvent['event'],
                ...allShowOnParams[0],
            };
        }

        async function runAction(page: Page) {
            const button = page.getByText('Run crossline action');
            await button.click();
        }

        test.beforeEach(async ({ page }) => {
            await gotoExample(page, toExamplePageUrl('context-menu-e2e', 'ag-17843-crosslines', 'vanilla').url);
        });

        test.describe('point: crossline 2 only', () => {
            test.beforeEach('getItems', async ({ page }) => {
                await contextMenu(page, { clientX: 332, clientY: 73 });
            });
            test('getItems', async ({ page }) => {
                expect(await popGetItems(page)).toEqual([itemsEvent(PARAMS_crossline2)]);
            });
            test('actions', async ({ page }) => {
                await runAction(page);
                expect(await popActions(page)).toEqual([actionEvent(PARAMS_crossline2)]);
            });
        });

        test.describe('point: crossline 3 only', () => {
            test.beforeEach('getItems', async ({ page }) => {
                await contextMenu(page, { clientX: 147, clientY: 338 });
            });
            test('getItems', async ({ page }) => {
                expect(await popGetItems(page)).toEqual([itemsEvent(PARAMS_crossline3)]);
            });
            test('actions', async ({ page }) => {
                await runAction(page);
                expect(await popActions(page)).toEqual([actionEvent(PARAMS_crossline3)]);
            });
        });

        test.describe('point: crosslines 1 and 2', () => {
            test.beforeEach('getItems', async ({ page }) => {
                await contextMenu(page, { clientX: 458, clientY: 79 });
            });
            test('getItems', async ({ page }) => {
                expect(await popGetItems(page)).toEqual([itemsEvent(PARAMS_crossline1, PARAMS_crossline2)]);
            });
            test('actions', async ({ page }) => {
                await runAction(page);
                expect(await popActions(page)).toEqual([actionEvent(PARAMS_crossline1, PARAMS_crossline2)]);
            });
        });

        test.describe('point: all crosslines', () => {
            test.beforeEach('getItems', async ({ page }) => {
                await contextMenu(page, { clientX: 458, clientY: 338 });
            });
            test('getItems', async ({ page }) => {
                expect(await popGetItems(page)).toEqual([
                    itemsEvent(PARAMS_crossline1, PARAMS_crossline2, PARAMS_crossline3),
                ]);
            });
            test('actions', async ({ page }) => {
                await runAction(page);
                expect(await popActions(page)).toEqual([
                    actionEvent(PARAMS_crossline1, PARAMS_crossline2, PARAMS_crossline3),
                ]);
            });
        });
    });
});
