import { afterEach, describe, it } from 'vitest';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-community';
import { compareImageSnapshot, setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';

import { createEnterpriseChart } from '../../test/utils';
import { ukRoadData } from '../map-test/ukRoadData';
import ukRoadTopology from '../map-test/ukRoadTopology.json';

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
    let chart: AgChartInstance;

    afterEach(() => {
        if (chart != null) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await compareImageSnapshot(chart, ctx);
    };

    describe('Simple Chart', () => {
        it('should render a simple chart', async () => {
            const options: AgChartOptions = { ...SIMPLIFIED_EXAMPLE };

            chart = await createEnterpriseChart(options);
            await compare();
        });
    });
});
