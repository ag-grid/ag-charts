import { afterEach, describe, expect, it, test, vi } from 'vitest';

import type { AgChartOptions, AgContextMenuItem, AgContextMenuItemShowOn } from 'ag-charts-community';
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
    setupMockPointerEvent,
    waitForChartStability,
} from 'ag-charts-community-test';
import { ChartAxisDirection } from 'ag-charts-core';
import { Caster } from 'ag-charts-test';

import { pointOnPolarCrossLine, polarCanvasPoint, polarCrossLineAt } from '../../test/polarCrossLines';
import { prepareEnterpriseTestOptions } from '../../test/utils';
import { DEFAULT_CONTEXT_MENU_CLASS } from './contextMenuStyles';

describe('Context Menu', () => {
    setupMockConsole();
    setupMockCanvas();
    setupMockPointerEvent();

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

    // `contextMenu.getItems()` receives the axis values under the pointer via its `coordinates` param.
    // Nine-decimal x labels are used so that the axis labels overhang the series area by a wide margin.
    const coordinatesOptions = (listeners?: { xAxisClick: () => void; yAxisClick: () => void }): AgChartOptions => ({
        data: Array.from({ length: 4 }, (_, i) => ({ x: i / 5, y: i * 2 })),
        axes: {
            x: {
                type: 'number',
                label: { avoidCollisions: false, rotation: 0, format: '#{0.9f}' },
                listeners: { click: listeners?.xAxisClick ?? (() => {}) },
            },
            y: { type: 'number', listeners: { click: listeners?.yAxisClick ?? (() => {}) } },
        },
        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
        contextMenu: { enabled: true },
    });

    const CROSS_LINE_OPTIONS: AgChartOptions = {
        data: Array.from({ length: 4 }, (_, i) => ({ x: i, y: i * 2 })),
        axes: {
            x: {
                type: 'number',
                crossLines: [
                    {
                        id: 'threshold',
                        type: 'line',
                        value: 1.5,
                        // `top` sits the label above the series area, on the container widget.
                        label: { text: 'Threshold', position: 'top' },
                    },
                ],
            },
            y: { type: 'number' },
        },
        series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
        contextMenu: { enabled: true },
    };

    // Canvas-space click points, read from the laid-out chart purely to place the pointer.
    function seriesAreaCentre() {
        const seriesRect = deproxy(chart).seriesRect;
        expect(seriesRect).toBeDefined();
        const { x, y, width, height } = seriesRect!;
        return { x: x + width / 2, y: y + height / 2 };
    }

    // The centre of an axis's own interactive region. Paired with a coordinate from `seriesAreaCentre()`,
    // this aims at the same place along the axis as the series-area click, but through the axis's dispatch.
    function axisBandCentre(direction: ChartAxisDirection) {
        const axis = new Caster(deproxy(chart).axes.find((a) => a.direction === direction))
            .cast(_ModuleSupport.Axis)
            .findProperty('getCanvasBounds')
            .castProperty('getCanvasBounds', Function).value;
        const { x, y, width, height } = axis.getCanvasBounds();
        return { x: x + width / 2, y: y + height / 2 };
    }

    // Centre of the first cross line's label on the given axis.
    function crossLineLabelCentre(direction: ChartAxisDirection) {
        const axis = deproxy(chart).axes.find((a) => a.direction === direction)!;
        const [crossLine] = _ModuleSupport.getCrossLinesPlugin(axis)?.getInstances() ?? [];
        expect(crossLine).toBeInstanceOf(_ModuleSupport.CartesianCrossLine);
        const { labelGroup } = crossLine as _ModuleSupport.CartesianCrossLine;
        const { x, y, width, height } = _ModuleSupport.Transformable.toCanvas(labelGroup);
        return { x: x + width / 2, y: y + height / 2 };
    }

    let cx: number = 0;
    let cy: number = 0;

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

    afterEach(() => {
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

        async function contextMenuAtSeriesAreaCentre() {
            const { x, y } = seriesAreaCentre();
            await contextMenuAction(x, y)(chart);
            await waitForChartStability(chart);
        }

        beforeEach(async () => {
            getItems = vi.fn(({ defaultItems }) => defaultItems);
            xAxisClick = vi.fn();
            yAxisClick = vi.fn();
            await prepareChart({ enabled: true, getItems }, coordinatesOptions({ xAxisClick, yAxisClick }));
        });

        // A few pixels of coordinate-frame error is enough to shift these values, and the default `closeTo`
        // tolerance would hide it.
        const veryCloseTo = (value: number) => expect.closeTo(value, 4);

        // Domains are 0..0.6 on x and 0..6 on y, so the series-area centre is exactly 0.3 and 3; every branch aims
        // at that same position and must report it through its own callback.
        test('reports the axis values under the pointer', async () => {
            await contextMenuAtSeriesAreaCentre();

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
            await contextMenuAction(seriesAreaCentre().x, axisBandCentre(ChartAxisDirection.X).y)(chart);
            await waitForChartStability(chart);

            expect(getItems).toHaveBeenCalledWith(expect.objectContaining({ showOn: 'axis', value: veryCloseTo(0.3) }));
        });

        test('the y-axis context menu reports the same value', async () => {
            await contextMenuAction(axisBandCentre(ChartAxisDirection.Y).x, seriesAreaCentre().y)(chart);
            await waitForChartStability(chart);

            expect(getItems).toHaveBeenCalledWith(expect.objectContaining({ showOn: 'axis', value: veryCloseTo(3) }));
        });

        test('the x-axis click listener reports the same value', async () => {
            await clickAction(seriesAreaCentre().x, axisBandCentre(ChartAxisDirection.X).y)(chart);
            await waitForChartStability(chart);

            expect(xAxisClick).toHaveBeenCalledWith(expect.objectContaining({ value: veryCloseTo(0.3) }));
        });

        test('the y-axis click listener reports the same value', async () => {
            await clickAction(axisBandCentre(ChartAxisDirection.Y).x, seriesAreaCentre().y)(chart);
            await waitForChartStability(chart);

            expect(yAxisClick).toHaveBeenCalledWith(expect.objectContaining({ value: veryCloseTo(3) }));
        });
    });

    describe('overlapping axis region', () => {
        let getItems: ReturnType<typeof vi.fn>;

        // Aims at the horizontal centre of the series area, on the band occupied by the crossing axis. Both are
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

    describe('cross-line region (CRT-1227)', () => {
        let getItems: ReturnType<typeof vi.fn>;

        function seriesRect() {
            const rect = deproxy(chart).seriesRect;
            expect(rect).toBeDefined();
            return rect!;
        }

        beforeEach(async () => {
            getItems = vi.fn(({ defaultItems }) => defaultItems);
            await prepareChart({ enabled: true, getItems }, CROSS_LINE_OPTIONS);
        });

        const threshold = expect.objectContaining({
            showOn: 'cross-line',
            crossLineId: 'threshold',
            crossLineType: 'line',
            value: 1.5,
        });

        test('right-clicking the line inside the series area offers the cross line', async () => {
            const { x } = crossLineLabelCentre(ChartAxisDirection.X);
            const { y, height } = seriesRect();
            await contextMenuAction(x, y + height / 2)(chart);
            await waitForChartStability(chart);

            expect(getItems).toHaveBeenCalledWith(threshold);
        });

        test('right-clicking the label outside the series area offers the cross line', async () => {
            const { x, y } = crossLineLabelCentre(ChartAxisDirection.X);
            // Guard the premise: a label inside the series area would exercise the series-widget path instead.
            expect(seriesRect().containsPoint(x, y)).toBe(false);

            await contextMenuAction(x, y)(chart);
            await waitForChartStability(chart);

            expect(getItems).toHaveBeenCalledWith(threshold);
        });

        test('right-clicking clear of the label outside the series area offers only the always region', async () => {
            const { x, y } = crossLineLabelCentre(ChartAxisDirection.X);
            // Halfway from the label centre to the series area's left edge: level with the label, clear of it.
            const { x: seriesX } = seriesRect();
            await contextMenuAction((x + seriesX) / 2, y)(chart);
            await waitForChartStability(chart);

            expect(getItems).toHaveBeenCalledWith(expect.objectContaining({ showOn: 'always' }));
            expect(getItems).not.toHaveBeenCalledWith(threshold);
        });
    });
    // AG-18600: `getItems` receives the DOM event that opened the menu, as the very same object the
    // `items[].action` callbacks receive, for every `showOn` scope.
    describe('getItems event (AG-18600)', () => {
        const PROBE_LABEL = 'Probe Item';

        // The probe is scoped to the region under test so that clicking it routes through that region's
        // branch of `createButtonOnClick`. `showsFor()` only shows an item whose `showOn` matches an active
        // region, so a mismatch would fail loudly at `clickMenuItem`.
        function probeItem(showOn: AgContextMenuItemShowOn, action: () => void): AgContextMenuItem {
            return { type: 'action', label: PROBE_LABEL, showOn, action } as AgContextMenuItem;
        }

        function clickMenuItem(label: string) {
            const menuItems = Array.from(
                document.body.getElementsByClassName(
                    `${DEFAULT_CONTEXT_MENU_CLASS}__item`
                ) as HTMLCollectionOf<HTMLElement>
            );
            const item = menuItems.find((menuItem) => menuItem.textContent?.includes(label));
            expect(item, `no context menu item labelled "${label}"`).toBeDefined();
            item!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
        }

        type OpenMenuOpts = {
            showOn: AgContextMenuItemShowOn;
            baseOptions: AgChartOptions;
            /** Evaluated after the chart exists, since the click point is read from the laid-out chart. */
            point: () => { x: number; y: number };
            open?: (x: number, y: number) => Promise<void>;
        };

        async function openMenu({ showOn, baseOptions, point, open }: OpenMenuOpts) {
            const action = vi.fn();
            const getItems = vi.fn((params: any) => [...params.defaultItems, probeItem(showOn, action)]);
            await prepareChart({ enabled: true, getItems }, baseOptions);

            const { x, y } = point();
            await (open ?? ((px: number, py: number) => contextMenuAction(px, py)(chart)))(x, y);
            await waitForChartStability(chart);

            return { getItems, action };
        }

        // AC1/AC3: the opening DOM event is on the params, and is the same reference on every overlapping
        // region reported through `allShowOnParams`.
        function expectOpeningEvent(getItems: ReturnType<typeof vi.fn>, showOn: AgContextMenuItemShowOn) {
            expect(getItems).toHaveBeenCalledTimes(1);
            const params = getItems.mock.calls[0][0];
            expect(params.showOn).toBe(showOn);
            expect(params.event).toBeInstanceOf(MouseEvent);
            expect(params.event.type).toBe('contextmenu');
            for (const showOnParams of params.allShowOnParams) {
                expect(showOnParams.event).toBe(params.event);
            }
            return params;
        }

        // AC2: the item action sees the very same event object as `getItems` did.
        function expectActionEvent(action: ReturnType<typeof vi.fn>, params: { event: Event }) {
            clickMenuItem(PROBE_LABEL);
            expect(action).toHaveBeenCalledTimes(1);
            expect(action.mock.calls[0][0].event).toBe(params.event);
        }

        function histogramBinCentre(datumIndex: number) {
            const series = deproxy(chart).series[0] as any;
            const node = series.getNodeData()[datumIndex];
            const { canvasX, canvasY } = _ModuleSupport.Transformable.toCanvasPoint(
                series.contentGroup,
                node.x + node.width / 2,
                node.y + node.height / 2
            );
            return { x: canvasX, y: canvasY };
        }

        function legendItemPoint() {
            const legendBBox = computeLegendBBox(deproxy(chart));
            return { x: legendBBox.x + 2, y: legendBBox.y + 2 };
        }

        const TITLE_OPTIONS: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            title: { enabled: true, text: 'Captioned Chart' },
        };

        function titleCentre() {
            const { x, y, width, height } = _ModuleSupport.Transformable.toCanvas(deproxy(chart).title.node);
            return { x: x + width / 2, y: y + height / 2 };
        }

        test('always', async () => {
            // Reuses the cross-line fixture's "clear of the label, outside the series area" point, which is
            // the one place in this suite where `always` is the primary region.
            const { getItems, action } = await openMenu({
                showOn: 'always',
                baseOptions: CROSS_LINE_OPTIONS,
                point: () => {
                    const { x, y } = crossLineLabelCentre(ChartAxisDirection.X);
                    const rect = deproxy(chart).seriesRect!;
                    return { x: (x + rect.x) / 2, y };
                },
            });

            const params = expectOpeningEvent(getItems, 'always');
            // Empty by design: an `always`-primary dispatch carries `regions = ['always']`, and the
            // overlap-region helper only ever reports series-area, axis and cross-line regions. The
            // `allShowOnParams` identity guarantee is therefore vacuous for this scope.
            expect(params.allShowOnParams).toEqual([]);
            expectActionEvent(action, params);
        });

        test('series-area', async () => {
            const { getItems, action } = await openMenu({
                showOn: 'series-area',
                baseOptions: coordinatesOptions(),
                point: seriesAreaCentre,
            });

            const params = expectOpeningEvent(getItems, 'series-area');
            expect(params.allShowOnParams.length).toBeGreaterThanOrEqual(1);
            expectActionEvent(action, params);
        });

        test('axis', async () => {
            const { getItems, action } = await openMenu({
                showOn: 'axis',
                baseOptions: coordinatesOptions(),
                point: () => ({ x: seriesAreaCentre().x, y: axisBandCentre(ChartAxisDirection.X).y }),
            });

            const params = expectOpeningEvent(getItems, 'axis');
            expect(params.allShowOnParams.length).toBeGreaterThanOrEqual(1);
            expectActionEvent(action, params);
        });

        test('series-node', async () => {
            const { getItems, action } = await openMenu({
                showOn: 'series-node',
                baseOptions: HISTOGRAM_OPTIONS,
                point: () => histogramBinCentre(0),
            });

            const params = expectOpeningEvent(getItems, 'series-node');
            expect(params.allShowOnParams.length).toBeGreaterThanOrEqual(1);
            expectActionEvent(action, params);
        });

        test('cross-line', async () => {
            const { getItems, action } = await openMenu({
                showOn: 'cross-line',
                baseOptions: CROSS_LINE_OPTIONS,
                point: () => crossLineLabelCentre(ChartAxisDirection.X),
            });

            const params = expectOpeningEvent(getItems, 'cross-line');
            expect(params.allShowOnParams.length).toBeGreaterThanOrEqual(1);
            expectActionEvent(action, params);
        });

        test('legend-item', async () => {
            const { getItems, action } = await openMenu({
                showOn: 'legend-item',
                baseOptions: EXAMPLE_OPTIONS,
                point: legendItemPoint,
            });

            const params = expectOpeningEvent(getItems, 'legend-item');
            expect(params.allShowOnParams).toHaveLength(1);
            // Before AG-18600 this action received the click on the menu item instead of the opening event.
            expectActionEvent(action, params);
        });

        test('caption', async () => {
            const { getItems, action } = await openMenu({
                showOn: 'caption',
                baseOptions: TITLE_OPTIONS,
                point: titleCentre,
            });

            const params = expectOpeningEvent(getItems, 'caption');
            expect(params.captionType).toBe('title');
            // A caption maps a pointer event back into canvas space as `offset + bboxOrigin`, so the offsets
            // synthesised for it must be relative to the caption rather than to the canvas. The click was
            // aimed at the caption's centre.
            const bbox = _ModuleSupport.Transformable.toCanvas(deproxy(chart).title.node);
            expect((params.event as MouseEvent).offsetX).toBeCloseTo(bbox.width / 2, 5);
            expect((params.event as MouseEvent).offsetY).toBeCloseTo(bbox.height / 2, 5);
            expect(params.allShowOnParams).toHaveLength(1);
            expectActionEvent(action, params);
        });

        test('a touch long-press reports its synthesised contextmenu event', async () => {
            const { getItems, action } = await openMenu({
                showOn: 'series-area',
                baseOptions: coordinatesOptions(),
                point: seriesAreaCentre,
                open: (x, y) => longTapAction(x, y)(chart),
            });

            const params = expectOpeningEvent(getItems, 'series-area');
            expectActionEvent(action, params);
        });

        test('reports the modifier keys held when the menu was opened', async () => {
            const { getItems } = await openMenu({
                showOn: 'series-area',
                baseOptions: coordinatesOptions(),
                point: seriesAreaCentre,
                open: (x, y) => contextMenuAction(x, y, { shiftKey: true })(chart),
            });

            const params = expectOpeningEvent(getItems, 'series-area');
            expect((params.event as MouseEvent).shiftKey).toBe(true);
        });

        // The built-in legend toggles route the opening event into the legend listeners, so a `legendItemClick`
        // raised from the context menu now reports the right-click rather than the menu item's own click.
        test('the built-in visibility toggle reports the opening event to legendItemClick', async () => {
            const legendItemClick = vi.fn();
            const getItems = vi.fn((params: any) => params.defaultItems);
            await prepareChart(
                { enabled: true, getItems },
                { ...EXAMPLE_OPTIONS, legend: { listeners: { legendItemClick } } }
            );

            const { x, y } = legendItemPoint();
            await contextMenuAction(x, y)(chart);
            await waitForChartStability(chart);

            const params = getItems.mock.calls[0][0];
            clickMenuItem('Toggle Visibility');
            await waitForChartStability(chart);

            expect(legendItemClick).toHaveBeenCalledTimes(1);
            const payload = legendItemClick.mock.calls[0][0];
            expect(payload.event).toBe(params.event);
            expect(payload.event.type).toBe('contextmenu');
        });

        test('the built-in other-series toggle reports the opening event to legendItemDoubleClick', async () => {
            const legendItemDoubleClick = vi.fn();
            const getItems = vi.fn((params: any) => params.defaultItems);
            // `toggle-other-series` is hidden unless the chart has more than one series.
            await prepareChart(
                { enabled: true, getItems },
                {
                    ...EXAMPLE_OPTIONS,
                    data: EXAMPLE_OPTIONS.data!.map((datum: any) => ({ ...datum, y2: datum.y / 2 })),
                    series: [
                        { type: 'bar', xKey: 'x', yKey: 'y' },
                        { type: 'bar', xKey: 'x', yKey: 'y2' },
                    ],
                    legend: { listeners: { legendItemDoubleClick } },
                }
            );

            const { x, y } = legendItemPoint();
            await contextMenuAction(x, y)(chart);
            await waitForChartStability(chart);

            const params = getItems.mock.calls[0][0];
            clickMenuItem('Toggle Other Series');
            await waitForChartStability(chart);

            expect(legendItemDoubleClick).toHaveBeenCalledTimes(1);
            const payload = legendItemDoubleClick.mock.calls[0][0];
            expect(payload.event).toBe(params.event);
            expect(payload.event.type).toBe('contextmenu');
        });
    });

    describe('polar cross-line region', () => {
        let getItems: ReturnType<typeof vi.fn>;

        beforeEach(async () => {
            getItems = vi.fn(({ defaultItems }) => defaultItems);
            await prepareChart(
                { enabled: true, getItems },
                {
                    data: [
                        { q: 'Q1', v: 2 },
                        { q: 'Q2', v: 4 },
                        { q: 'Q3', v: 6 },
                        { q: 'Q4', v: 8 },
                    ],
                    series: [{ type: 'radar-line', angleKey: 'q', radiusKey: 'v' }],
                    axes: {
                        angle: {
                            type: 'angle-category',
                            shape: 'circle',
                            crossLines: [{ id: 'band', type: 'range', range: ['Q2', 'Q3'] }],
                        },
                        radius: {
                            type: 'radius-number',
                            shape: 'circle',
                            min: 0,
                            max: 10,
                            crossLines: [{ id: 'threshold', type: 'line', value: 5 }],
                        },
                    },
                    contextMenu: { enabled: true },
                }
            );
        });

        const band = expect.objectContaining({
            showOn: 'cross-line',
            crossLineId: 'band',
            axisId: 'angle',
            direction: 'angle',
            crossLineType: 'range',
            range: ['Q2', 'Q3'],
        });
        const threshold = expect.objectContaining({
            showOn: 'cross-line',
            crossLineId: 'threshold',
            axisId: 'radius',
            direction: 'radius',
            crossLineType: 'line',
            value: 5,
        });

        test('AC1-AC4: right-clicking an angle range fill offers that cross line', async () => {
            const { canvasX, canvasY } = pointOnPolarCrossLine(polarCrossLineAt(deproxy(chart), 'angle'));
            await contextMenuAction(canvasX, canvasY)(chart);
            await waitForChartStability(chart);

            expect(getItems).toHaveBeenCalledWith(band);
            expect(getItems).not.toHaveBeenCalledWith(threshold);
        });

        test('AC1-AC4: right-clicking a radius line offers that cross line', async () => {
            const { canvasX, canvasY } = pointOnPolarCrossLine(polarCrossLineAt(deproxy(chart), 'radius'));
            await contextMenuAction(canvasX, canvasY)(chart);
            await waitForChartStability(chart);

            expect(getItems).toHaveBeenCalledWith(threshold);
            expect(getItems).not.toHaveBeenCalledWith(band);
        });

        test('AC5: right-clicking clear of both cross lines offers no cross-line region', async () => {
            // Q1 sits at the top of the circle, outside the Q2-Q3 band; radius 3.5 is clear of the threshold and the datum.
            const radius = polarCrossLineAt(deproxy(chart), 'radius');
            const { canvasX, canvasY } = polarCanvasPoint(radius, radius.axisOuterRadius * 0.35, -Math.PI / 2);
            await contextMenuAction(canvasX, canvasY)(chart);
            await waitForChartStability(chart);

            expect(getItems).toHaveBeenCalledWith(expect.objectContaining({ showOn: 'series-area' }));
            expect(getItems).not.toHaveBeenCalledWith(expect.objectContaining({ showOn: 'cross-line' }));
        });
    });
});
