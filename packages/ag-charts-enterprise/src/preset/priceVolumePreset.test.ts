import { afterEach, describe, expect, it, jest } from '@jest/globals';

import {
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    prepareFinancialTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';
import type { AgChartInstance, AgFinancialChartOptions } from 'ag-charts-types';

import { AgCharts } from '../main';
import { getStockData } from './test/stockData';

const EXAMPLES: Record<string, AgFinancialChartOptions> = {
    minimal: { data: getStockData() },
    'with-navigator': { data: getStockData(), navigator: true },
};

describe('priceVolumePreset', () => {
    setupMockConsole();

    let chart: AgChartInstance<AgFinancialChartOptions>;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
        jest.restoreAllMocks();
    });

    const ctx = setupMockCanvas();

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    describe('#createFinancialChart', () => {
        it.each(Object.entries(EXAMPLES))(
            'for %s it should create chart instance as expected',
            async (_exampleName, example) => {
                const options: AgFinancialChartOptions = { ...example };
                prepareFinancialTestOptions(options);

                chart = AgCharts.createFinancialChart(options);
                await waitForChartStability(chart);
            }
        );

        it.each(Object.entries(EXAMPLES))(
            'for %s it should render to canvas as expected',
            async (_exampleName, example) => {
                const options: AgFinancialChartOptions = { ...example };
                prepareFinancialTestOptions(options);

                chart = AgCharts.createFinancialChart(options);
                await compare();
            }
        );
    });
});
