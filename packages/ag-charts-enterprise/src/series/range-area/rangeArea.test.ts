import { afterEach, describe, expect, it } from '@jest/globals';

import { type AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    expectWarningsCalls,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    spyOnAnimationManager,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';

describe('RangeAreaSeries', () => {
    setupMockConsole();

    let chart: any;
    const ctx = setupMockCanvas();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const CATEGORY_DATA: { month: string | Date; high: number; low: number; average: number }[] = [
        {
            month: 'Jan',
            high: 9,
            low: 4,
            average: 6,
        },
        {
            month: 'Feb',
            high: 9,
            low: 4,
            average: 6,
        },
        {
            month: 'Mar',
            high: 11,
            low: 5,
            average: 8,
        },
        {
            month: 'Apr',
            high: 14,
            low: 7,
            average: 11,
        },
        {
            month: 'May',
            high: 17,
            low: 10,
            average: 14,
        },
        {
            month: 'June',
            high: 20,
            low: 13,
            average: 17,
        },
        {
            month: 'July',
            high: 23,
            low: 15,
            average: 19,
        },
        {
            month: 'Aug',
            high: 22,
            low: 15,
            average: 19,
        },
        {
            month: 'Sept',
            high: 19,
            low: 13,
            average: 16,
        },
        {
            month: 'Oct',
            high: 15,
            low: 10,
            average: 13,
        },
        {
            month: 'Nov',
            high: 11,
            low: 7,
            average: 9,
        },
        {
            month: 'Dec',
            high: 9,
            low: 5,
            average: 7,
        },
    ];
    const CONTINUOUS_DATA = CATEGORY_DATA.map(
        (datum: { month: string | Date; low: number; high: number; average: number }, i: number) => ({
            ...datum,
            month: new Date(2022, i, 15),
        })
    );

    const RANGE_AREA_OPTIONS: AgChartOptions = {
        data: CATEGORY_DATA,
        series: [
            {
                type: 'range-area',
                xKey: 'month',
                yLowKey: 'low',
                yHighKey: 'high',
                label: {
                    enabled: true,
                    formatter: ({ value }) => `${value}°C`,
                },
                strokeWidth: 2,
                fill: '#E7E8E9',
                stroke: '#2A5783',
                marker: {
                    enabled: true,
                },
            },
        ],
    };

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot({ ...IMAGE_SNAPSHOT_DEFAULTS, failureThreshold: 0 });
    };

    it(`should render a range-area chart as expected`, async () => {
        const options: AgChartOptions = { ...RANGE_AREA_OPTIONS };
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-area chart with inverted high and low values`, async () => {
        const options: AgChartOptions = {
            ...RANGE_AREA_OPTIONS,
            data: CATEGORY_DATA.map((datum) => ({
                ...datum,
                low: datum.high,
                high: datum.low,
            })),
        };
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-area chart with some inverted high and low values`, async () => {
        const invertedDataIndices = [2, 5, 9];

        const options: AgChartOptions = {
            ...RANGE_AREA_OPTIONS,
            data: CATEGORY_DATA.map((datum, index) => ({
                ...datum,
                low: invertedDataIndices.includes(index) ? datum.high : datum.low,
                high: invertedDataIndices.includes(index) ? datum.low : datum.high,
            })),
        };
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-area chart with missing and invalid y values`, async () => {
        const invalidDataIndices = [2, 5, 9];
        const options: AgChartOptions = {
            ...RANGE_AREA_OPTIONS,
            data: CATEGORY_DATA.map((datum, index) => ({
                ...datum,
                low: invalidDataIndices.includes(index) ? `invalid` : datum.low,
                high: invalidDataIndices.includes(index) ? `invalid` : datum.high,
            })),
        };
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-area chart with reversed axes`, async () => {
        const options: AgChartOptions = {
            ...RANGE_AREA_OPTIONS,
            axes: [
                {
                    position: 'left',
                    type: 'number',
                    reverse: true,
                },
                {
                    position: 'bottom',
                    type: 'category',
                    reverse: true,
                },
            ],
        };
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-area chart with a time x-axis`, async () => {
        const options: AgChartOptions = {
            ...RANGE_AREA_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: [
                {
                    position: 'left',
                    type: 'number',
                },
                {
                    position: 'bottom',
                    type: 'time',
                },
            ],
        };
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-area chart with reversed time x-axis`, async () => {
        const options: AgChartOptions = {
            ...RANGE_AREA_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: [
                {
                    position: 'left',
                    type: 'number',
                },
                {
                    position: 'bottom',
                    type: 'time',
                    reverse: true,
                },
            ],
        };
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render a range-area chart with a number x-axis`, async () => {
        const invalidDataIndices = [2, 5, 9];
        const options: AgChartOptions = {
            ...RANGE_AREA_OPTIONS,
            data: CONTINUOUS_DATA.map((datum, index) => ({
                ...datum,
                month: invalidDataIndices.includes(index) ? `invalid` : datum.month,
            })),
            axes: [
                {
                    position: 'left',
                    type: 'number',
                },
                {
                    position: 'bottom',
                    type: 'number',
                },
            ],
        };
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
        expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [string] ignored:",
    "[invalid]",
  ],
]
`);
    });

    it(`should render a range-area chart with reversed number x-axis`, async () => {
        const invalidDataIndices = [2, 5, 9];
        const options: AgChartOptions = {
            ...RANGE_AREA_OPTIONS,
            data: CONTINUOUS_DATA.map((datum, index) => ({
                ...datum,
                month: invalidDataIndices.includes(index) ? `invalid` : datum.month,
            })),
            axes: [
                {
                    position: 'left',
                    type: 'number',
                },
                {
                    position: 'bottom',
                    type: 'number',
                    reverse: true,
                },
            ],
        };
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
        expectWarningsCalls().toMatchInlineSnapshot(`
[
  [
    "AG Charts - invalid value of type [string] ignored:",
    "[invalid]",
  ],
]
`);
    });

    it(`should render a range-area chart with missing and invalid x values`, async () => {
        const options: AgChartOptions = {
            ...RANGE_AREA_OPTIONS,
            data: CONTINUOUS_DATA,
            axes: [
                {
                    position: 'left',
                    type: 'number',
                },
                {
                    position: 'bottom',
                    type: 'time',
                },
            ],
        };
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
    });

    it(`should render the legend shape as expected`, async () => {
        const options: AgChartOptions = {
            data: [
                { x: 'q1', fHi: 22, fLo: 18, gHi: 15, gLo: 14, kHi: 7, kLo: 4 },
                { x: 'q2', fHi: 24, fLo: 19, gHi: 18, gLo: 17, kHi: 11, kLo: 6 },
                { x: 'q3', fHi: 21, fLo: 18, gHi: 17, gLo: 16, kHi: 13, kLo: 7 },
                { x: 'q4', fHi: 20, fLo: 17, gHi: 14, gLo: 13, kHi: 9, kLo: 5 },
            ],
            series: [
                {
                    type: 'range-area',
                    xKey: 'x',
                    yHighKey: 'fHi',
                    yLowKey: 'fLo',
                    marker: { shape: 'cross', enabled: false }, // should draw a square
                },
                {
                    type: 'range-area',
                    xKey: 'x',
                    yHighKey: 'gHi',
                    yLowKey: 'gLo',
                    marker: { shape: 'triangle', enabled: true },
                },
                {
                    type: 'range-area',
                    xKey: 'x',
                    yHighKey: 'kHi',
                    yLowKey: 'kLo',
                    marker: { shape: 'circle', enabled: true },
                },
            ],
        };
        prepareEnterpriseTestOptions(options);

        chart = AgCharts.create(options);
        await compare();
    });

    describe('initial animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for RANGE_AREA_OPTIONS should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = { ...RANGE_AREA_OPTIONS };
                prepareEnterpriseTestOptions(options);

                chart = AgCharts.create(options);
                await waitForChartStability(chart);
                await compare();
            });
        }
    });
});
