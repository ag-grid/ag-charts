import { afterEach, describe, expect, it } from '@jest/globals';

import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    deproxy,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';
import { ukRoadData } from '../map-test/ukRoadData';
// @ts-expect-error
import ukRoadTopology from '../map-test/ukRoadTopology';

const SIMPLIFIED_EXAMPLE: AgChartOptions = {
    data: ukRoadData,
    topology: ukRoadTopology,
    series: [
        {
            type: 'map-line-background',
        },
    ],
};

describe('MapLineBackgroundSeries', () => {
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

    describe('Simple Chart', () => {
        it('should render a simple chart', async () => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });
    });
});
