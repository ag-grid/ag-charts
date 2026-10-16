import { afterEach, describe, it } from 'vitest';

import type { AgChartInstance, AgChartOptions } from 'ag-charts-community';
import { GALLERY_EXAMPLES, compareImageSnapshot, setupMockCanvas, setupMockConsole } from 'ag-charts-community-test';

import { ukData } from '../series/map-test/ukData';
import ukTopology from '../series/map-test/ukTopology.json';
import { createEnterpriseChart } from '../test/utils';

const SERIES_AREA_OPTIONS = {
    seriesArea: {
        border: {
            stroke: 'red',
            strokeOpacity: 0.5,
            strokeWidth: 4,
        },
        cornerRadius: 8,
        padding: {
            top: 20,
            right: 20,
            bottom: 20,
            left: 20,
        },
    },
};

describe('SeriesArea', () => {
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

    describe('standalone', () => {
        it('should render as expected', async () => {
            const options: AgChartOptions = {
                ...GALLERY_EXAMPLES.SIMPLE_CHORD_EXAMPLE.options,
                ...SERIES_AREA_OPTIONS,
            };

            chart = await createEnterpriseChart(options);
            await compare();
        });
    });

    describe('topology', () => {
        it('should render as expected', async () => {
            const options: AgChartOptions = {
                data: ukData,
                topology: ukTopology,
                series: [
                    {
                        type: 'map-shape',
                        idKey: 'name',
                    },
                ],
                ...SERIES_AREA_OPTIONS,
            };

            chart = await createEnterpriseChart(options);
            await compare();
        });
    });
});
