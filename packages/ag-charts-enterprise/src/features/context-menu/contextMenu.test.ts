import { afterEach, describe, expect, it, test } from '@jest/globals';

import { AgCharts } from 'ag-charts-community';
import type { AgChartOptions, AgContextMenuItem } from 'ag-charts-community';
import {
    contextMenuAction,
    expectWarningsCalls,
    longTapAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';
import { DEFAULT_CONTEXT_MENU_CLASS } from './contextMenuStyles';

describe('Context Menu', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: any;

    const EXAMPLE_OPTIONS: AgChartOptions = {
        data: [
            { x: 0, y: 15 },
            { x: 1, y: 50 },
            { x: 2, y: 25 },
            { x: 3, y: 75 },
            { x: 4, y: 50 },
            { x: 5, y: 25 },
            { x: 6, y: 50 },
            { x: 7, y: 75 },
        ],
        series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
        contextMenu: {
            enabled: true,
        },
        legend: {},
    };

    let cx: number = 0;
    let cy: number = 0;
    let tmpPointerEvent: typeof globalThis.PointerEvent;

    async function prepareChart(contextMenuOptions?: AgChartOptions['contextMenu'], baseOptions = EXAMPLE_OPTIONS) {
        const options: AgChartOptions = {
            ...baseOptions,
            contextMenu: { ...baseOptions.contextMenu, ...(contextMenuOptions ?? {}) },
        };
        prepareEnterpriseTestOptions(options);
        cx = options.width! / 2;
        cy = options.height! / 2;

        chart = AgCharts.create(options);

        // Click once in the chart to ensure the chart is active / mouse is over it to ensure the first scroll wheel
        // event is triggered.
        await waitForChartStability(chart);
    }

    beforeEach(() => {
        // Node.js does not have a PointerEvent constructor (which is what we use to create synthetic 'contextmenu'
        // events). So create custom class for it (Note: the standard PointerEvent class extends MouseEvent).
        tmpPointerEvent = globalThis.PointerEvent;
        globalThis.PointerEvent = class extends MouseEvent {} as typeof globalThis.PointerEvent;
    });

    afterEach(() => {
        globalThis.PointerEvent = tmpPointerEvent;
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const compare = async () => {
        await waitForChartStability(chart);
        expect(document.body.getElementsByClassName(DEFAULT_CONTEXT_MENU_CLASS)).toMatchSnapshot();
    };

    it('should initially be hidden', async () => {
        await prepareChart();
        await compare();
    });

    describe('should show the default actions', () => {
        test('mouse', async () => {
            await prepareChart();
            await contextMenuAction(cx, cy)(chart);
            await compare();
        });
        test('touch', async () => {
            await prepareChart();
            await longTapAction(cx, cy)(chart);
            await compare();
        });
    });

    describe('should show the legend actions', () => {
        test('mouse', async () => {
            await prepareChart();
            await contextMenuAction(410, 575)(chart);
            await compare();
        });
        test('touch', async () => {
            await prepareChart();
            await longTapAction(410, 575)(chart);
            await compare();
        });
    });

    test('submenu cycle detection', () => {
        const subsubmenu: Exclude<AgContextMenuItem, string> = { label: 'subsubmenu', items: [] };
        const contextMenu: AgChartOptions['contextMenu'] = {
            items: [
                'defaults',
                'separator',
                { type: 'action', label: 'my action', action: () => {} },
                {
                    label: 'my submenu',
                    items: [{ type: 'action', label: 'subaction', action: () => {} }, subsubmenu],
                },
            ],
        };
        subsubmenu.items = contextMenu.items;
        chart = AgCharts.create(prepareEnterpriseTestOptions({ ...EXAMPLE_OPTIONS, contextMenu }));
        expectWarningsCalls().toMatchSnapshot();
    });

    describe('AG-16259 showsOn', () => {
        beforeEach(async () => {
            const options = prepareEnterpriseTestOptions({
                title: {},
                subtitle: {},
                footnote: {},
                contextMenu: {
                    items: [
                        { showOn: 'always', label: 'always', action: () => {} },
                        { showOn: 'series-area', label: 'series-area', action: () => {} },
                        { showOn: 'series-node', label: 'series-node', action: () => {} },
                        { showOn: 'legend-item', label: 'legend-item', action: () => {} },
                    ],
                },
                data: [
                    { x: 'Jun', y1: 50, y2: 40 },
                    { x: 'Jul', y1: 70, y2: 50 },
                    { x: 'Aug', y1: 60, y2: 30 },
                ],
                series: [
                    { type: 'bar', xKey: 'x', yKey: 'y1', yName: 'Series 1' },
                    { type: 'bar', xKey: 'x', yKey: 'y2', yName: 'Series 2' },
                ],
                axes: {
                    x: { title: { text: 'X Axis Label' }, type: 'category' },
                    y: { title: { text: 'Y Axis Label' }, type: 'number' },
                },
            });
            chart = AgCharts.create(options);
            await waitForChartStability(chart);
        });

        const alwaysText = 'always';
        const seriesAreaText = 'alwaysseries-area';
        const seriesNodeText = 'alwaysseries-areaseries-node';
        const legendText = 'alwayslegend-item';
        const cases: [string, number, number, string][] = [
            ['chart', 204, 28, alwaysText],
            ['title', 407, 32, alwaysText],
            ['subtitle', 396, 60, alwaysText],
            ['footnote', 403, 575, alwaysText],
            ['xAxisLabel', 432, 489, alwaysText],
            ['yAxisLabel', 30, 263, alwaysText],
            ['seriesNode1', 397, 250, seriesNodeText],
            ['seriesNode2', 710, 374, seriesNodeText],
            ['seriesArea', 283, 175, seriesAreaText],
            ['legendItem1', 369, 536, legendText],
            ['legendItem2', 460, 537, legendText],
        ];

        test.each(cases)('%s', async (_, x, y, expectedHtmlText) => {
            await contextMenuAction(x, y)(chart);
            await waitForChartStability(chart);
            const actualHtmlText = document.body
                .getElementsByClassName(DEFAULT_CONTEXT_MENU_CLASS)
                .item(0)?.textContent;

            expect(actualHtmlText).toEqual(expectedHtmlText);
        });
    });
});
