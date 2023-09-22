import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import type { AgChartOptions } from '../../main';
import { AgEnterpriseCharts } from '../../main';

import {
    waitForChartStability,
    setupMockCanvas,
    extractImageData,
    IMAGE_SNAPSHOT_DEFAULTS,
    spyOnAnimationManager,
} from 'ag-charts-community-test';
import { prepareEnterpriseTestOptions } from '../../test/utils';

expect.extend({ toMatchImageSnapshot });

describe('Radial Column Chart', () => {
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
        title: {
            text: `Night & Gale Inc revenue by product category`,
        },
        subtitle: {
            text: 'in million U.S. dollars',
        },
        data: [
            { quarter: `Q1'22`, 'Mountain air': 4.35, 'Polar winds': 2.14, 'Donut holes': 3.91 },
            { quarter: `Q2'22`, 'Mountain air': 4.28, 'Polar winds': 3.13, 'Donut holes': 3.04 },
            { quarter: `Q3'22`, 'Mountain air': 4.14, 'Polar winds': 3.34, 'Donut holes': 3.18 },
            { quarter: `Q4'22`, 'Mountain air': 3.48, 'Polar winds': 3.56, 'Donut holes': 3.61 },
            { quarter: `Q1'23`, 'Mountain air': 3.35, 'Polar winds': 3.14, 'Donut holes': 3.91 },
            { quarter: `Q2'23`, 'Mountain air': 3.28, 'Polar winds': 3.13, 'Donut holes': 3.54 },
            { quarter: `Q3'23`, 'Mountain air': 3.14, 'Polar winds': 2.84, 'Donut holes': 3.18 },
            { quarter: `Q4'23`, 'Mountain air': 2.48, 'Polar winds': 2.46, 'Donut holes': 3.21 },
        ],
        series: [
            {
                type: 'radial-column',
                angleKey: 'quarter',
                radiusKey: 'Mountain air',
            },
            {
                type: 'radial-column',
                angleKey: 'quarter',
                radiusKey: 'Polar winds',
            },
            {
                type: 'radial-column',
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
        prepareEnterpriseTestOptions(options as any);
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
        prepareEnterpriseTestOptions(options as any);

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
        prepareEnterpriseTestOptions(options as any);

        chart = AgEnterpriseCharts.create(options);
        await compare();
    });

    describe('initial animation', () => {
        afterEach(() => {
            jest.restoreAllMocks();
        });

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for EXAMPLE_OPTIONS should animate at ${ratio * 100}%`, async () => {
                spyOnAnimationManager(1200, ratio);

                const options: AgChartOptions = { ...EXAMPLE_OPTIONS };
                prepareEnterpriseTestOptions(options);

                chart = AgEnterpriseCharts.create(options);
                await waitForChartStability(chart);
                await compare();
            });
        }
    });
});
