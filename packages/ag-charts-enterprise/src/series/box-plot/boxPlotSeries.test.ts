import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';

import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    setupMockCanvas,
    spyOnAnimationManager,
    waitForChartStability,
} from 'ag-charts-community-test';

import type { AgChartOptions } from '../../main';
import { AgCharts } from '../../main';
import { prepareEnterpriseTestOptions } from '../../test/utils';

const BOX_PLOT_BAR_OPTIONS: AgChartOptions = {
    data: [
        { year: '2020', min: 3.07, q1: 4.78, median: 5.3, q3: 6.3, max: 7.27 },
        { year: '2021', min: 4.87, q1: 5.8, median: 6.13, q3: 6.66, max: 7.09 },
        { year: '2022', min: 4.4, q1: 4.41, median: 4.64, q3: 4.96, max: 5.2 },
        { year: '2023', min: 7.31, q1: 7.32, median: 7.32, q3: 7.33, max: 7.33 },
    ],
    series: [
        {
            type: 'box-plot',
            xKey: 'year',
            minKey: 'min',
            q1Key: 'q1',
            medianKey: 'median',
            q3Key: 'q3',
            maxKey: 'max',
        },
    ],
};

describe('Chart', () => {
    const ctx = setupMockCanvas();

    beforeEach(() => {
        // eslint-disable-next-line no-console
        console.warn = jest.fn();
    });

    afterEach(() => {
        // eslint-disable-next-line no-console
        expect(console.warn).not.toBeCalled();
    });

    const compareSnapshot = async (chart: any) => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);

        chart.destroy();
    };

    it(`should render a box-plot chart as expected`, async () => {
        const options = BOX_PLOT_BAR_OPTIONS;
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgCharts.create(options));
    });

    describe('initial animation', () => {
        const animate = spyOnAnimationManager();

        for (const ratio of [0, 0.25, 0.5, 0.75, 1]) {
            it(`for BOX_PLOT_BAR_OPTIONS should animate at ${ratio * 100}%`, async () => {
                animate(1200, ratio);

                const options: AgChartOptions = { ...BOX_PLOT_BAR_OPTIONS };
                prepareEnterpriseTestOptions(options);

                await compareSnapshot(AgCharts.create(options));
            });
        }
    });
});
