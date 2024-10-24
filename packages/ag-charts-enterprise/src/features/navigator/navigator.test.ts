import { afterEach, describe, expect, it } from '@jest/globals';

import { type AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import {
    type CartesianTestCase,
    IMAGE_SNAPSHOT_DEFAULTS,
    cartesianChartAssertions,
    expectWarningsCalls,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

const xyData = (ys: number[]) => ys.map((y, x) => ({ x, y }));

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
            ],
            navigator: {
                miniChart: {
                    series: [
                        {
                            type: 'line',
                            xKey: 'x',
                            yKey: 'y',
                            data: xyData([5, 7, 8, 3, 0, 2, 6, 8, 10, 9, 6]),
                            strokeWidth: 1,
                            marker: {
                                enabled: false,
                            },
                        },
                    ],
                },
            },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'category'], seriesTypes: ['line'] }),
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
                min: 0.2,
                max: 0.7,
                miniChart: {},
            },
        },
        assertions: cartesianChartAssertions({ axisTypes: ['number', 'category'], seriesTypes: ['line', 'area'] }),
        warnings: [
            ['AG Charts - Property [navigator.min] is deprecated. Use [initialState.zoom.ratioX] instead.'],
            ['AG Charts - Property [navigator.max] is deprecated. Use [initialState.zoom.ratioX] instead.'],
        ],
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

    describe('#create', () => {
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
                const compare = async () => {
                    await waitForChartStability(chart);

                    const imageData = extractImageData(ctx);
                    expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
                };

                const options: AgCartesianChartOptions = { ...example.options };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await compare();

                if (example.warnings) expectWarningsCalls().toEqual(example.warnings);
            }
        );
    });
});
