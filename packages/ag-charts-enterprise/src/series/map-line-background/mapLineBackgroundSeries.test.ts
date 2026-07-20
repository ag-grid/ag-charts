import { afterEach, describe, it } from 'vitest';

import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';
import { compareImageSnapshot, deproxy, setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';

import { prepareEnterpriseTestOptions } from '../../test/utils';
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
    let chart: any;

    afterEach(() => {
        if (chart) {
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
            prepareEnterpriseTestOptions(options);

            chart = deproxy(AgCharts.create(options));
            await compare();
        });
    });
});
