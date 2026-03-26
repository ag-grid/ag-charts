import { afterEach, describe, expect, it } from '@jest/globals';

import type { AgChartOptions } from 'ag-charts-types';

import type { Chart } from '../chart';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    createChart,
    extractImageData,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

describe('Marker Shapes', () => {
    setupMockConsole();
    const ctx = setupMockCanvas();

    let chart: Chart;

    afterEach(() => {
        if (chart) {
            chart.destroy();
        }
    });

    const compare = async () => {
        await waitForChartStability(chart);
        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    // CRT-991: Verify pin marker shape renders correctly with large stroke widths.
    // The fix simplified the pin shape geometry to avoid mitring artifacts
    // that appeared as spikes when using large strokeWidth values.
    describe('CRT-991 pin marker with large stroke', () => {
        it('should render pin marker without artifacts at normal stroke width', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y: 10 },
                    { x: 1, y: 20 },
                    { x: 2, y: 15 },
                ],
                series: [
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'y',
                        shape: 'pin',
                        size: 30,
                    },
                ],
            };
            prepareTestOptions(options);
            chart = await createChart(options);
            await compare();
        });

        it('should render pin marker without artifacts at large stroke width', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y: 10 },
                    { x: 1, y: 20 },
                    { x: 2, y: 15 },
                ],
                series: [
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'y',
                        shape: 'pin',
                        size: 30,
                        stroke: 'red',
                        strokeWidth: 10,
                    },
                ],
            };
            prepareTestOptions(options);
            chart = await createChart(options);
            await compare();
        });

        it('should render pin marker in legend without artifacts', async () => {
            const options: AgChartOptions = {
                data: [
                    { x: 0, y: 10 },
                    { x: 1, y: 20 },
                ],
                series: [
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'y',
                        shape: 'pin',
                        size: 20,
                        stroke: 'blue',
                        strokeWidth: 5,
                    },
                ],
                legend: {
                    item: {
                        marker: {
                            size: 40,
                            strokeWidth: 10,
                        },
                    },
                },
            };
            prepareTestOptions(options);
            chart = await createChart(options);
            await compare();
        });
    });
});
