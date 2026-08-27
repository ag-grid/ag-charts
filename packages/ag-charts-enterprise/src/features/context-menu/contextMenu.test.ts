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
import { ChartAxisDirection } from 'ag-charts-core';
import { Caster } from 'ag-charts-test';

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

    describe('series-node items on a markerless series (AG-10226)', () => {
        const MARKERLESS_LINE_OPTIONS: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: [{ type: 'line', xKey: 'x', yKey: 'y', marker: { enabled: false } }],
        };

        const nodeCanvasPoint = (datumIndex: number) => {
            const series = deproxy(chart).series[0] as any;
            const node = series.getNodeData()[datumIndex];
            expect(node).toBeDefined();
            return _ModuleSupport.Transformable.toCanvasPoint(series.contentGroup, node.point.x, node.point.y);
        };

        it('surfaces series-node items carrying the picked datum', async () => {
            const action = vi.fn();
            const items: AgContextMenuItem[] = [{ type: 'action', label: 'Node Item', showOn: 'series-node', action }];
            await prepareChart({ enabled: true, items }, MARKERLESS_LINE_OPTIONS);

            const { canvasX: x, canvasY: y } = nodeCanvasPoint(4);
            await contextMenuAction(x, y)(chart);
            await waitForChartStability(chart);

            const menuItems = Array.from(
                document.body.getElementsByClassName(
                    `${DEFAULT_CONTEXT_MENU_CLASS}__item`
                ) as HTMLCollectionOf<HTMLElement>
            );
            const nodeItem = menuItems.find((item) => item.textContent?.includes('Node Item'));
            expect(nodeItem).toBeDefined();

            nodeItem!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
            await waitForChartStability(chart);

            expect(action).toHaveBeenCalledTimes(1);
            expect(action.mock.calls[0][0].datum).toEqual({ x: 4, y: 50 });
        });

        it('passes the picked datum to getItems under the series-node scope', async () => {
            const getItems = vi.fn((_params: any) => []);
            await prepareChart({ enabled: true, getItems }, MARKERLESS_LINE_OPTIONS);

            const { canvasX: x, canvasY: y } = nodeCanvasPoint(4);
            await contextMenuAction(x, y)(chart);
            await waitForChartStability(chart);

            expect(getItems).toHaveBeenCalledTimes(1);
            const params = getItems.mock.calls[0][0];
            expect(params.showOn).toBe('series-node');
            expect(params.datum).toEqual({ x: 4, y: 50 });
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

    describe('coordinates param', () => {
        let getItems: ReturnType<typeof vi.fn>;
        let xAxisClick: ReturnType<typeof vi.fn>;
        let yAxisClick: ReturnType<typeof vi.fn>;

        function plotCentre() {
            const seriesRect = deproxy(chart).seriesRect;
            expect(seriesRect).toBeDefined();
            const { x, y, width, height } = seriesRect!;
            return { x: x + width / 2, y: y + height / 2 };
        }

        // The centre of an axis's own interactive region. Paired with a coordinate from `plotCentre()`, this
        // aims at the same place along the axis as the series-area click, but through the axis's dispatch.
        function axisBandCentre(direction: ChartAxisDirection) {
            const axis = new Caster(deproxy(chart).axes.find((a) => a.direction === direction))
                .cast(_ModuleSupport.Axis)
                .findProperty('getCanvasBounds')
                .castProperty('getCanvasBounds', Function).value;
            const { x, y, width, height } = axis.getCanvasBounds();
            return { x: x + width / 2, y: y + height / 2 };
        }

        async function contextMenuAtPlotCentre() {
            const { x, y } = plotCentre();
            await contextMenuAction(x, y)(chart);
            await waitForChartStability(chart);
        }

        beforeEach(async () => {
            getItems = vi.fn(({ defaultItems }) => defaultItems);
            xAxisClick = vi.fn();
            yAxisClick = vi.fn();
            await prepareChart(
                { enabled: true, getItems },
                {
                    data: Array.from({ length: 4 }, (_, i) => ({ x: i / 5, y: i * 2 })),
                    // `contextMenu.getItems()` receives the axis values under the pointer via its `coordinates` param.
                    // Nine-decimal x labels are used so that the axis labels overhang the plot area by a wide margin.
                    axes: {
                        x: {
                            type: 'number',
                            label: { avoidCollisions: false, rotation: 0, format: '#{0.9f}' },
                            listeners: { click: xAxisClick },
                        },
                        y: { type: 'number', listeners: { click: yAxisClick } },
                    },
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    contextMenu: { enabled: true },
                }
            );
        });

        // A few pixels of coordinate-frame error is enough to shift these values, and the default `closeTo`
        // tolerance would hide it.
        const veryCloseTo = (value: number) => expect.closeTo(value, 4);

        // Domains are 0..0.6 on x and 0..6 on y, so the plot centre is exactly 0.3 and 3; every branch aims
        // at that same position and must report it through its own callback.
        test('reports the axis values under the pointer', async () => {
            await contextMenuAtPlotCentre();

            expect(getItems).toHaveBeenCalledWith(
                expect.objectContaining({
                    coordinates: expect.objectContaining({
                        x: expect.objectContaining({ value: veryCloseTo(0.3) }),
                        y: expect.objectContaining({ value: veryCloseTo(3) }),
                    }),
                })
            );
        });

        test('the x-axis context menu reports the same value', async () => {
            await contextMenuAction(plotCentre().x, axisBandCentre(ChartAxisDirection.X).y)(chart);
            await waitForChartStability(chart);

            expect(getItems).toHaveBeenCalledWith(expect.objectContaining({ showOn: 'axis', value: veryCloseTo(0.3) }));
        });

        test('the y-axis context menu reports the same value', async () => {
            await contextMenuAction(axisBandCentre(ChartAxisDirection.Y).x, plotCentre().y)(chart);
            await waitForChartStability(chart);

            expect(getItems).toHaveBeenCalledWith(expect.objectContaining({ showOn: 'axis', value: veryCloseTo(3) }));
        });

        test('the x-axis click listener reports the same value', async () => {
            await clickAction(plotCentre().x, axisBandCentre(ChartAxisDirection.X).y)(chart);
            await waitForChartStability(chart);

            expect(xAxisClick).toHaveBeenCalledWith(expect.objectContaining({ value: veryCloseTo(0.3) }));
        });

        test('the y-axis click listener reports the same value', async () => {
            await clickAction(axisBandCentre(ChartAxisDirection.Y).x, plotCentre().y)(chart);
            await waitForChartStability(chart);

            expect(yAxisClick).toHaveBeenCalledWith(expect.objectContaining({ value: veryCloseTo(3) }));
        });
    });

    describe('overlapping axis region', () => {
        let getItems: ReturnType<typeof vi.fn>;

        // Aims at the horizontal centre of the plot area, on the band occupied by the crossing axis. Both are
        // read from internals purely to place the pointer.
        async function contextMenuAtCrossingAxisCentre() {
            const inner = deproxy(chart);
            const seriesRect = inner.seriesRect!;
            const xAxis = new Caster(inner.axes.find((axis) => axis.direction === ChartAxisDirection.X))
                .cast(_ModuleSupport.Axis)
                .findProperty('getCanvasBounds')
                .castProperty('getCanvasBounds', Function).value;
            expect(seriesRect).toBeDefined();

            const { x, width } = seriesRect;
            await contextMenuAction(x + width / 2, xAxis.getCanvasBounds().y + 5)(chart);
            await waitForChartStability(chart);
        }

        beforeEach(async () => {
            getItems = vi.fn(({ defaultItems }) => defaultItems);
            // A `crossAt` axis is annotated onto the menu by the series area rather than its own proxy region:
            // a separate path from `coordinates`, and the only one applying `crossAxisTranslation`.
            await prepareChart(
                { enabled: true, getItems },
                {
                    data: Array.from({ length: 4 }, (_, i) => ({ x: i / 5, y: i * 2 - 3 })),
                    axes: {
                        x: {
                            type: 'number',
                            crossAt: { value: 0 },
                            label: { format: '#{0.9f}', avoidCollisions: false, rotation: 0 },
                        },
                        y: { type: 'number' },
                    },
                    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                    contextMenu: { enabled: true },
                }
            );
        });

        // The x domain is 0..0.6, so its centre is 0.3.
        test('reports the axis value under the pointer', async () => {
            await contextMenuAtCrossingAxisCentre();

            expect(getItems).toHaveBeenCalledWith(
                expect.objectContaining({
                    allShowOnParams: expect.arrayContaining([
                        expect.objectContaining({ showOn: 'axis', value: expect.closeTo(0.3) }),
                    ]),
                })
            );
        });
    });
});
