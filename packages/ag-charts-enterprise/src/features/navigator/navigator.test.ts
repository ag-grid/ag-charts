import { afterEach, describe, expect, it } from 'vitest';

import { type AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import {
    CROSSLINE_EXAMPLES,
    type CartesianTestCase,
    cartesianChartAssertions,
    compareImageSnapshot,
    deproxy,
    expectWarningsCalls,
    repeat,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

const xyData = (ys: number[], key = 'y') => ys.map((y, x) => ({ x, [key]: y }));

const NAVIGATOR_MINICHART_EXAMPLES: Record<string, CartesianTestCase> = {
    SINGLE_LINE_SERIES: {
        options: {
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                    data: xyData([5, 7, 8, 3, 0, 2, 6, 8, 10, 9, 6]),
                },
            ],
            navigator: {
                miniChart: {},
            },
        },
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['line'] }),
    },
    BAR_SERIES: {
        options: {
            series: [
                {
                    type: 'bar',
                    xKey: 'x',
                    yKey: 'y',
                    data: xyData([5, 7, 8, 3, 0, 2, 6, 8, 10, 9, 6]),
                },
            ],
            navigator: {
                miniChart: {},
            },
        },
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['bar'] }),
    },
    HORIZONTAL_BAR_SERIES: {
        options: {
            series: [
                {
                    type: 'bar',
                    direction: 'horizontal',
                    xKey: 'x',
                    yKey: 'y',
                    data: xyData([5, 7, 8, 3, 0, 2, 6, 8, 10, 9, 6]),
                },
            ],
            navigator: {
                miniChart: {},
            },
        },
        assertions: cartesianChartAssertions({ axisTypes: { x: 'number', y: 'category' }, seriesTypes: ['bar'] }),
    },
    MINI_CHART_WITH_CROSSLINES: {
        options: {
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                    data: xyData([5, 7, 8, 3, 0, 2, 6, 8, 10, 9, 6]),
                },
            ],
            navigator: {
                miniChart: {},
            },
            axes: {
                y: {
                    type: 'number',
                    position: 'left',
                    crossLines: [
                        {
                            type: 'range',
                            range: [3, 7],
                            fill: 'blue',
                            fillOpacity: 0.2,
                        },
                        {
                            type: 'line',
                            value: 5,
                            stroke: 'green',
                            strokeWidth: 2,
                        },
                    ],
                },
                x: {
                    type: 'category',
                    position: 'bottom',
                    crossLines: [
                        {
                            type: 'line',
                            value: 5,
                            stroke: 'red',
                            strokeWidth: 2,
                        },
                        {
                            type: 'range',
                            range: [3, 7],
                            fill: 'yellow',
                            fillOpacity: 0.2,
                        },
                    ],
                },
            },
        },
        assertions: cartesianChartAssertions({ axisTypes: { x: 'category', y: 'number' }, seriesTypes: ['line'] }),
    },
    LINE_AREA_SERIES: {
        options: {
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                    data: xyData([5, 7, 8, 3, 3, 2, 6, 8, 10, 9, 6]),
                },
                {
                    type: 'area',
                    xKey: 'x',
                    yKey: 'y',
                    data: xyData([3, 2, 1, 1, 1, 0, 2, 3, 4, 3, 4]),
                },
            ],
            navigator: {
                miniChart: {},
            },
        },
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'category', y: 'number' },
            seriesTypes: ['line', 'area'],
        }),
    },
    MINI_CHART_SERIES_OVERRIDE: {
        options: {
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                    data: xyData([5, 7, 8, 3, 0, 2, 6, 8, 10, 9, 6]),
                    strokeWidth: 3,
                },
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'z',
                    data: xyData([3, 2, 1, 1, 1, 0, 2, 3, 4, 3, 4], 'z'),
                    marker: { enabled: true },
                },
            ],
            navigator: {
                miniChart: {
                    series: [{ strokeWidth: 1, stroke: 'blue' }, { stroke: 'green' }],
                },
            },
        },
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'category', y: 'number' },
            seriesTypes: ['line', 'line'],
        }),
    },
    MINI_CHART_NAVIGATOR_HANDLES: {
        options: {
            series: [
                {
                    type: 'line',
                    xKey: 'x',
                    yKey: 'y',
                    data: xyData([5, 7, 8, 3, 3, 2, 6, 8, 10, 9, 6]),
                },
                {
                    type: 'area',
                    xKey: 'x',
                    yKey: 'y',
                    data: xyData([3, 2, 1, 1, 1, 0, 2, 3, 4, 3, 4]),
                },
            ],
            navigator: {
                miniChart: {},
            },
            initialState: {
                zoom: {
                    ratioX: {
                        start: 0.2,
                        end: 0.7,
                    },
                },
            },
        },
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'category', y: 'number' },
            seriesTypes: ['line', 'area'],
        }),
    },
};

const { VALID_RANGE_CROSSLINES } = CROSSLINE_EXAMPLES;

const NAVIGATOR_ZOOM_EXAMPLES: Record<string, CartesianTestCase> = {
    NAV_ZOOMED_CROSSLINES: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { enabled: true },
            initialState: { zoom: { ratioX: { start: 0.4, end: 0.6 } } },
        },
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
    },
    NAV_ZOOMED_NO_CROSSLINES: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { enabled: true },
            initialState: { zoom: { ratioX: { start: 0, end: 0.05 } } },
        },
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
    },
    NAV_ZOOMED_NO_CROSSLINES_2: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { enabled: true },
            initialState: { zoom: { ratioX: { start: 0.95, end: 1 } } },
        },
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
    },
    NAV_ZOOMED_CLIPPED_CROSSLINES_1: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { enabled: true },
            initialState: { zoom: { ratioX: { start: 0, end: 0.5 } } },
        },
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
    },
    NAV_ZOOMED_CLIPPED_CROSSLINES_2: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { enabled: true },
            initialState: { zoom: { ratioX: { start: 0.5, end: 1 } } },
        },
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
    },
    NAV_ZOOMED_INSIDE_CROSSLINES_1: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { enabled: true },
            initialState: { zoom: { ratioX: { start: 0.4, end: 0.6 } } },
        },
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
    },
    NAV_ZOOMED_INSIDE_CROSSLINES_2: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { enabled: true },
            initialState: { zoom: { ratioX: { start: 0.51, end: 0.55 } } },
        },
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
    },
    NAV_ZOOMED_EDGE_CROSSLINES_1: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { enabled: true },
            initialState: { zoom: { ratioX: { start: 0.14661198412976173, end: 0.3286788694841538 } } },
        },
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
    },
    NAV_ZOOMED_EDGE_CROSSLINES_2: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { enabled: true },
            initialState: { zoom: { ratioX: { start: 0.15, end: 0.3286788694841538 + 0.001 } } },
        },
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
    },
    NAV_ZOOMED_EDGE_CROSSLINES_3: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { enabled: true },
            initialState: { zoom: { ratioX: { start: 1 - 0.3286788694841538, end: 1 - 0.14661198412976173 } } },
        },
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
    },
    NAV_ZOOMED_EDGE_CROSSLINES_4: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { enabled: true },
            initialState: { zoom: { ratioX: { start: 1 - 0.3286788694841538 - 0.006, end: 0.85 } } },
        },
        assertions: cartesianChartAssertions({
            axisTypes: { x: 'unit-time', y: 'number' },
            seriesTypes: repeat('line', 2),
        }),
    },
};

describe('Navigator', () => {
    setupMockConsole();

    let chart: any;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await compareImageSnapshot(chart, ctx);
    };

    describe('keyboard focus', () => {
        it('should not retain focus override on previous handle after arrow key navigation (CRT-1107)', async () => {
            const options: AgCartesianChartOptions = {
                series: [{ type: 'line', xKey: 'x', yKey: 'y', data: xyData([5, 7, 8, 3, 0, 2]) }],
                navigator: { enabled: true },
            };
            prepareEnterpriseTestOptions(options);
            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const toolbar = document.querySelector('.ag-charts-proxy-navigator-toolbar');
            expect(toolbar).not.toBeNull();

            const sliders = toolbar!.querySelectorAll<HTMLInputElement>('input[type="range"]');
            expect(sliders.length).toBe(3);

            const slider = sliders[0];
            slider.focus();
            expect(document.activeElement).toBe(slider);

            slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', code: 'ArrowDown', bubbles: true }));

            expect(slider.getAttribute('data-focus-override')).not.toBe('true');
            expect(document.activeElement).not.toBe(slider);
        });
    });

    describe('#create', () => {
        it.each(Object.entries(NAVIGATOR_ZOOM_EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const options: AgCartesianChartOptions = { ...example.options };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await example.assertions(chart);

                expectWarningsCalls().toEqual([]);
            }
        );

        it.each(Object.entries(NAVIGATOR_ZOOM_EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                const options: AgCartesianChartOptions = { ...example.options };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await compare();

                expectWarningsCalls().toEqual([]);
            }
        );

        it.each(Object.entries(NAVIGATOR_MINICHART_EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const options: AgCartesianChartOptions = { ...example.options };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await example.assertions(chart);

                if (example.warnings) expectWarningsCalls().toEqual(example.warnings);
            }
        );

        it.each(Object.entries(NAVIGATOR_MINICHART_EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                const options: AgCartesianChartOptions = { ...example.options };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await compare();

                if (example.warnings) expectWarningsCalls().toEqual(example.warnings);
            }
        );
    });

    describe('AG-17456 mini-chart axis nice', () => {
        const getMiniChartAxes = (c: any) => {
            const miniChart = deproxy(c).modulesManager.getModule<any>('navigator').miniChart;
            const findByDirection = (d: 'x' | 'y') => miniChart.axes.find((axis: any) => axis.direction === d);
            return { x: findByDirection('x'), y: findByDirection('y') };
        };

        it('propagates main axis nice=true (default) to the mini chart x-axis', async () => {
            const options: AgCartesianChartOptions = {
                series: [{ type: 'line', xKey: 'x', yKey: 'y', data: xyData([5, 7, 8, 3, 0, 2]) }],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                navigator: { miniChart: {} },
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const { x: miniX } = getMiniChartAxes(chart);
            expect(miniX).toBeDefined();
            expect(miniX.nice).toBe(true);
        });

        it('propagates main axis nice=false to the mini chart x-axis', async () => {
            const options: AgCartesianChartOptions = {
                series: [{ type: 'line', xKey: 'x', yKey: 'y', data: xyData([5, 7, 8, 3, 0, 2]) }],
                axes: {
                    x: { type: 'number', position: 'bottom', nice: false },
                    y: { type: 'number', position: 'left' },
                },
                navigator: { miniChart: {} },
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const { x: miniX } = getMiniChartAxes(chart);
            expect(miniX).toBeDefined();
            expect(miniX.nice).toBe(false);
        });

        it('keeps nice=false on the mini chart cross axis even when the main cross axis is nice', async () => {
            const options: AgCartesianChartOptions = {
                series: [{ type: 'line', xKey: 'x', yKey: 'y', data: xyData([5, 7, 8, 3, 0, 2]) }],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                navigator: { miniChart: {} },
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const { y: miniY } = getMiniChartAxes(chart);
            expect(miniY).toBeDefined();
            expect(miniY.nice).toBe(false);
        });

        it('on a flipped (horizontal) bar chart, propagates nice to the y-direction mini-chart axis only', async () => {
            const options: AgCartesianChartOptions = {
                series: [
                    { type: 'bar', direction: 'horizontal', xKey: 'x', yKey: 'y', data: xyData([5, 7, 8, 3, 0, 2]) },
                ],
                axes: {
                    x: { type: 'number', position: 'left' },
                    y: { type: 'number', position: 'bottom' },
                },
                navigator: { miniChart: {} },
            };
            prepareEnterpriseTestOptions(options);

            chart = AgCharts.create(options);
            await waitForChartStability(chart);

            const { x: miniX, y: miniY } = getMiniChartAxes(chart);
            expect(miniY).toBeDefined();
            expect(miniY.nice).toBe(true);
            expect(miniX).toBeDefined();
            expect(miniX.nice).toBe(false);
        });
    });
});
