import type { AgCartesianSeriesLabelFormatterParams } from 'ag-charts-community';
import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import type { AgChartOptions } from '../main';
import { AgEnterpriseCharts, _ModuleSupport } from '../main';

import {
    waitForChartStability,
    setupMockCanvas,
    extractImageData,
    IMAGE_SNAPSHOT_DEFAULTS,
    prepareTestOptions,
} from 'ag-charts-community-test';

expect.extend({ toMatchImageSnapshot });

describe('Chart', () => {
    let chart: any;
    const ctx = setupMockCanvas();

    beforeEach(() => {
        // eslint-disable-next-line no-console
        console.warn = jest.fn();
    });

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        // eslint-disable-next-line no-console
        expect(console.warn).not.toBeCalled();
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
                    formatter: ({ value }: AgCartesianSeriesLabelFormatterParams) => `${value}°C`,
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
        (expect(imageData) as any).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    it(`should render a range-area chart as expected`, async () => {
        const options: AgChartOptions = { ...RANGE_AREA_OPTIONS };
        prepareTestOptions(options as any);

        chart = AgEnterpriseCharts.create(options);
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
        prepareTestOptions(options as any);

        chart = AgEnterpriseCharts.create(options);
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
        prepareTestOptions(options as any);

        chart = AgEnterpriseCharts.create(options);
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
        prepareTestOptions(options as any);

        chart = AgEnterpriseCharts.create(options);
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
        prepareTestOptions(options as any);

        chart = AgEnterpriseCharts.create(options);
        await compare();
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
        prepareTestOptions(options as any);

        chart = AgEnterpriseCharts.create(options);
        await compare();
    });
});
