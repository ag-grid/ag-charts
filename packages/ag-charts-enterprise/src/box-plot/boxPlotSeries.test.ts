import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { toMatchImageSnapshot } from 'jest-image-snapshot';
import type { AgChartOptions } from '../main';
import { AgEnterpriseCharts } from '../main';
import {
    extractImageData,
    IMAGE_SNAPSHOT_DEFAULTS,
    setupMockCanvas,
    waitForChartStability,
} from 'ag-charts-community-test';
import { prepareEnterpriseTestOptions } from '../test/utils';

expect.extend({ toMatchImageSnapshot });

const BOX_PLOT_BAR_OPTIONS: AgChartOptions = {
    data: [{ year: '2020', min: 2, q1: 3, median: 5, q3: 8, max: 10 }],
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

describe.skip('Chart', () => {
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
        (expect(imageData) as any).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);

        chart.destroy();
    };

    it(`should render a box-plot chart as expected`, async () => {
        const options = BOX_PLOT_BAR_OPTIONS;
        prepareEnterpriseTestOptions(options as any);
        await compareSnapshot(AgEnterpriseCharts.create(options));
    });
});
