import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import type { AgChartOptions } from '../../main';
import { AgEnterpriseCharts } from '../../main';

import {
    waitForChartStability,
    setupMockCanvas,
    extractImageData,
    IMAGE_SNAPSHOT_DEFAULTS,
    prepareTestOptions,
} from 'ag-charts-community-test';

expect.extend({ toMatchImageSnapshot });

describe('Nightingale Chart', () => {
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

    const EXAMPLE_OPTIONS: AgChartOptions = {
        container: document.getElementById('myChart'),
        title: {
            text: `Night & Gale Inc revenue by product category`,
        },
        subtitle: {
            text: 'in million U.S. dollars',
        },
        data: [
            { quarter: 'Q1', 'Mountain air': 4.35, 'Polar winds': 2.14, 'Donut holes': 3.91 },
            { quarter: 'Q2', 'Mountain air': 4.28, 'Polar winds': 3.13, 'Donut holes': 3.04 },
            { quarter: 'Q3', 'Mountain air': 3.14, 'Polar winds': 2.94, 'Donut holes': 2.18 },
            { quarter: 'Q4', 'Mountain air': 2.48, 'Polar winds': 2.56, 'Donut holes': 3.61 },
        ],
        series: [
            {
                type: 'nightingale',
                angleKey: 'quarter',
                radiusKey: 'Mountain air',
            },
            {
                type: 'nightingale',
                angleKey: 'quarter',
                radiusKey: 'Polar winds',
            },
            {
                type: 'nightingale',
                angleKey: 'quarter',
                radiusKey: 'Donut holes',
            },
        ],
    };

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        (expect(imageData) as any).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    it(`should render nightingale chart as expected`, async () => {
        const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
        prepareTestOptions(options as any);
        chart = AgEnterpriseCharts.create(options);
        await compare();
    });

    it(`should render stacked nightingale as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    stacked: true,
                };
            }),
        };
        prepareTestOptions(options as any);

        chart = AgEnterpriseCharts.create(options);
        await compare();
    });

    it(`should render normalized nightingale as expected`, async () => {
        const options: AgChartOptions = {
            ...EXAMPLE_OPTIONS,
            series: EXAMPLE_OPTIONS.series?.map((series) => {
                return {
                    ...series,
                    stacked: true,
                    normalizedTo: 100,
                };
            }),
        };
        prepareTestOptions(options as any);

        chart = AgEnterpriseCharts.create(options);
        await compare();
    });
});
