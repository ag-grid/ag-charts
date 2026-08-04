import { afterEach, describe, expect, it, test, vi } from 'vitest';

import type { AgChartOptions, AgContextMenuItem } from 'ag-charts-community';
import { AgCharts, _ModuleSupport } from 'ag-charts-community';
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

    describe('series-node getItems datums (AG-17546)', () => {
        const HISTOGRAM_OPTIONS: AgChartOptions = {
            data: [{ x: 2 }, { x: 5 }, { x: 8 }, { x: 35 }],
            series: [
                {
                    type: 'histogram',
                    xKey: 'x',
                    bins: [
                        [0, 10],
                        [10, 20],
                        [20, 30],
                        [30, 40],
                    ],
                },
            ],
            contextMenu: { enabled: true },
        };

        const nodeCanvasPoint = (datumIndex: number) => {
            const series = deproxy(chart).series[0] as any;
            const node = series.getNodeData()[datumIndex];
            return _ModuleSupport.Transformable.toCanvasPoint(
                series.contentGroup,
                node.x + node.width / 2,
                node.y + node.height / 2
            );
        };

        it('passes the bin source rows to getItems as datums', async () => {
            const getItems = vi.fn((_params: any) => []);
            await prepareChart({ enabled: true, getItems }, HISTOGRAM_OPTIONS);

            const { canvasX: x, canvasY: y } = nodeCanvasPoint(0);
            await contextMenuAction(x, y)(chart);
            await waitForChartStability(chart);

            expect(getItems).toHaveBeenCalledTimes(1);
            const params = getItems.mock.calls[0][0];
            // datums exposes every row grouped into the bin; datum is undefined for a bin.
            expect(params.datums).toHaveLength(3);
            expect(params.datums).toEqual(expect.arrayContaining([{ x: 2 }, { x: 5 }, { x: 8 }]));
            expect(params.datum).toBeUndefined();
        });

        it('leaves datums undefined for a 1:1 series node', async () => {
            const getItems = vi.fn((_params: any) => []);
            await prepareChart({ enabled: true, getItems });

            const { canvasX: x, canvasY: y } = nodeCanvasPoint(3);
            await contextMenuAction(x, y)(chart);
            await waitForChartStability(chart);

            expect(getItems).toHaveBeenCalledTimes(1);
            const params = getItems.mock.calls[0][0];
            expect(params.datum).toEqual({ x: 3, y: 75 });
            expect(params.datums).toBeUndefined();
        });
    });

    describe('legend-item without toggleSeries (AG-17832)', () => {
        test('shows legend-item items when toggleSeries is false', async () => {
            await prepareChart(
                {
                    enabled: true,
                    items: [
                        { type: 'action', label: 'Always Item', showOn: 'always', action: () => {} },
                        { type: 'action', label: 'Legend Item', showOn: 'legend-item', action: () => {} },
                    ],
                },
                { ...EXAMPLE_OPTIONS, legend: { toggleSeries: false } }
            );

            const chartInstance = deproxy(chart);
            const legendBBox = computeLegendBBox(chartInstance);
            await contextMenuAction(legendBBox.x + 2, legendBBox.y + 2)(chart);
            await waitForChartStability(chart);

            const labels = Array.from(
                document.body.getElementsByClassName(
                    `${DEFAULT_CONTEXT_MENU_CLASS}__item`
                ) as HTMLCollectionOf<HTMLElement>
            ).map((item) => item.textContent);

            expect(labels.some((label) => label?.includes('Legend Item'))).toBe(true);
            expect(labels.some((label) => label?.includes('Always Item'))).toBe(true);
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
