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

    const RANGE_COLUMN_OPTIONS: AgChartOptions = {
        data: [
            {
                date: 'Jan',
                high: 5.2,
                low: -13.9,
            },
            {
                date: 'Feb',
                high: 10.6,
                low: -16.7,
            },
            {
                date: 'Mar',
                high: 11.6,
                low: -4.7,
            },
            {
                date: 'Apr',
                high: 16.8,
                low: -4.4,
            },
            {
                date: 'May',
                high: 27.2,
                low: -2.1,
            },
            {
                date: 'Jun',
                high: 29.4,
                low: 5.9,
            },
            {
                date: 'Jul',
                high: 29.1,
                low: 6.5,
            },
            {
                date: 'Aug',
                high: 25.4,
                low: 4.7,
            },
            {
                date: 'Sep',
                high: 21.6,
                low: 4.3,
            },
            {
                date: 'Oct',
                high: 15.1,
                low: -3.5,
            },
            {
                date: 'Nov',
                high: 12.5,
                low: -9.8,
            },
            {
                date: 'Dec',
                high: 8.4,
                low: -11.5,
            },
        ],
        series: [
            {
                type: 'range-column',
                xKey: 'date',
                yLowKey: 'low',
                yHighKey: 'high',
                label: {
                    enabled: true,
                    formatter: ({ value }: AgCartesianSeriesLabelFormatterParams) => `${value}°C`,
                },
            },
        ],
    };

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        (expect(imageData) as any).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    function switchSeriesType<T>(opts: T, type: 'range-bar' | 'range-column'): T {
        return {
            ...opts,
            series: opts['series']?.map((s) => ({
                ...s,
                type,
            })),
        };
    }

    it(`should render a range-column chart as expected`, async () => {
        const options: AgChartOptions = { ...RANGE_COLUMN_OPTIONS };
        prepareTestOptions(options as any);

        chart = AgEnterpriseCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart as expected`, async () => {
        const options: AgChartOptions = { ...switchSeriesType(RANGE_COLUMN_OPTIONS, 'range-bar') };
        prepareTestOptions(options as any);

        chart = AgEnterpriseCharts.create(options);
        await compare();
    });

    it(`should render a range-column chart with inverted high and low values`, async () => {
        const options: AgChartOptions = {
            ...RANGE_COLUMN_OPTIONS,
            data: RANGE_COLUMN_OPTIONS.data.map((datum: { date: string; high: number; low: number }) => ({
                ...datum,
                low: datum.high,
                high: datum.low,
            })),
        };
        prepareTestOptions(options as any);

        chart = AgEnterpriseCharts.create(options);
        await compare();
    });

    it(`should render a range-bar chart with inverted high and low values`, async () => {
        const RANGE_BAR_OPTIONS = switchSeriesType(RANGE_COLUMN_OPTIONS, 'range-bar');
        const options: AgChartOptions = {
            ...RANGE_BAR_OPTIONS,
            data: RANGE_BAR_OPTIONS.data.map((datum: { date: string; high: number; low: number }) => ({
                ...datum,
                low: datum.high,
                high: datum.low,
            })),
        };
        prepareTestOptions(options as any);

        chart = AgEnterpriseCharts.create(options);
        await compare();
    });
});
