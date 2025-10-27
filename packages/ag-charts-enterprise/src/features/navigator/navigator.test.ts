import { afterEach, describe, expect, it } from '@jest/globals';

import { type AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import {
    CROSSLINE_EXAMPLES,
    type CartesianTestCase,
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    expectWarningsCalls,
    extractImageData,
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
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'category'], seriesTypes: ['line'] }),
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
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'category'], seriesTypes: ['line'] }),
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
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'category'], seriesTypes: ['line', 'area'] }),
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
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'category'], seriesTypes: ['line', 'line'] }),
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
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'category'], seriesTypes: ['line', 'area'] }),
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
        assertions: cartesianChartAssertions({ axisTypes: ['unit-time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    NAV_ZOOMED_NO_CROSSLINES: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { enabled: true },
            initialState: { zoom: { ratioX: { start: 0, end: 0.05 } } },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['unit-time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    NAV_ZOOMED_NO_CROSSLINES_2: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { enabled: true },
            initialState: { zoom: { ratioX: { start: 0.95, end: 1 } } },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['unit-time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    NAV_ZOOMED_CLIPPED_CROSSLINES_1: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { enabled: true },
            initialState: { zoom: { ratioX: { start: 0, end: 0.5 } } },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['unit-time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    NAV_ZOOMED_CLIPPED_CROSSLINES_2: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { enabled: true },
            initialState: { zoom: { ratioX: { start: 0.5, end: 1 } } },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['unit-time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    NAV_ZOOMED_INSIDE_CROSSLINES_1: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { enabled: true },
            initialState: { zoom: { ratioX: { start: 0.4, end: 0.6 } } },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['unit-time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    NAV_ZOOMED_INSIDE_CROSSLINES_2: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { enabled: true },
            initialState: { zoom: { ratioX: { start: 0.51, end: 0.55 } } },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['unit-time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    NAV_ZOOMED_EDGE_CROSSLINES_1: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { enabled: true },
            initialState: { zoom: { ratioX: { start: 0.14661198412976173, end: 0.3286788694841538 } } },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['unit-time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    NAV_ZOOMED_EDGE_CROSSLINES_2: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { enabled: true },
            initialState: { zoom: { ratioX: { start: 0.15, end: 0.3286788694841538 + 0.001 } } },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['unit-time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    NAV_ZOOMED_EDGE_CROSSLINES_3: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { enabled: true },
            initialState: { zoom: { ratioX: { start: 1 - 0.3286788694841538, end: 1 - 0.14661198412976173 } } },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['unit-time', 'number'], seriesTypes: repeat('line', 2) }),
    },
    NAV_ZOOMED_EDGE_CROSSLINES_4: {
        options: {
            ...VALID_RANGE_CROSSLINES,
            navigator: { enabled: true },
            initialState: { zoom: { ratioX: { start: 1 - 0.3286788694841538 - 0.006, end: 0.85 } } },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['unit-time', 'number'], seriesTypes: repeat('line', 2) }),
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
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

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
});
