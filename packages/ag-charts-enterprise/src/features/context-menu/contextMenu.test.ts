import { afterEach, describe, expect, it, test } from '@jest/globals';

import type { AgChartOptions, AgContextMenuItem } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import {
    clickAction,
    computeLegendBBox,
    contextMenuAction,
    deproxy,
    expectWarningsCalls,
    hoverAction,
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

    describe('legend highlight state', () => {
        test('clears highlight when opening menu', async () => {
            await prepareChart();
            const chartInstance = deproxy(chart);
            const highlightManager = chartInstance.ctx.highlightManager;
            const legendBBox = computeLegendBBox(chartInstance);
            const x = legendBBox.x + 2;
            const y = legendBBox.y + 2;

            await hoverAction(x, y)(chart);
            await waitForChartStability(chart);
            expect(highlightManager.getActiveHighlight()).toBeDefined();

            await contextMenuAction(x, y)(chart);
            await waitForChartStability(chart);

            expect(highlightManager.getActiveHighlight()).toBeUndefined();
        });

        test('does not leave highlight after toggling visibility', async () => {
            await prepareChart();
            const chartInstance = deproxy(chart);
            const highlightManager = chartInstance.ctx.highlightManager;
            const legendBBox = computeLegendBBox(chartInstance);
            const x = legendBBox.x + 2;
            const y = legendBBox.y + 2;

            await clickAction(x, y)(chart);
            await waitForChartStability(chart);
            expect(highlightManager.getActiveHighlight()).toBeUndefined();

            await contextMenuAction(x, y)(chart);
            await waitForChartStability(chart);

            const menuItems = Array.from(
                document.body.getElementsByClassName(
                    `${DEFAULT_CONTEXT_MENU_CLASS}__item`
                ) as HTMLCollectionOf<HTMLElement>
            );
            const toggleVisibilityItem = menuItems.find((item) => item.textContent?.includes('Toggle Visibility'));
            expect(toggleVisibilityItem).toBeDefined();

            toggleVisibilityItem!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            await waitForChartStability(chart);

            expect(highlightManager.getActiveHighlight()).toBeUndefined();
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
});
