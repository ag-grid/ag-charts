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

import { setupEnterpriseModules } from '../main-modules';
import { getStockData } from './test/stockData';

const EXAMPLES: Record<string, AgFinancialChartOptions> = {
    minimal: { data: getStockData() },
    // 'with-navigator': { data: getStockData(), navigator: true },
};

const { AgCharts } = setupEnterpriseModules();

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

    const snapshot = async () => {
        await waitForChartStability(chart);

        return ctx.nodeCanvas?.toBuffer('raw');
    };

    const compareImageDataUrl = async () => {
        await waitForChartStability(chart);
        const reference = await snapshot();

        const canvasCount = ctx.getActiveCanvasInstances().length;

        const imageURL = await chart.getImageDataURL();
        const imagePNGData = Buffer.from(imageURL.split(',')[1], 'base64');
        expect(imagePNGData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);

        const imageRaw = ctx.getActiveCanvasInstances()[canvasCount];
        expect(imageRaw.toBuffer('raw')).toMatchImage(reference);
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

        it.each(Object.entries(EXAMPLES))(
            'for %s it should export image as expected (AG-12985)',
            async (_exampleName, example) => {
                const options: AgFinancialChartOptions = { ...example };
                prepareFinancialTestOptions(options);

                chart = AgCharts.createFinancialChart(options);
                await compareImageDataUrl();
            }
        );
    });
});
