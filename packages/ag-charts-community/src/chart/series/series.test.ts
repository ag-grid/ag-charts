import { describe, expect, it } from '@jest/globals';

import type { AgChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import { deproxy, prepareTestOptions, setupMockCanvas, setupMockConsole, waitForChartStability } from '../test/utils';

describe('Series', () => {
    setupMockConsole();
    setupMockCanvas();

    describe('CRT-692: Series Focusable Property', () => {
        const testData = [
            { x: 0, y: 10, z: 5 },
            { x: 1, y: 20, z: 15 },
            { x: 2, y: 15, z: 10 },
            { x: 3, y: 25, z: 20 },
        ];

        it('should have focusable === true for line series', async () => {
            const options: AgChartOptions = prepareTestOptions({
                data: testData,
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
            });

            const chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            expect(chart.series.length).toBe(1);
            expect(chart.series[0].focusable).toBe(true);

            chart.destroy();
        });

        it('should have focusable === true for bar series', async () => {
            const options: AgChartOptions = prepareTestOptions({
                data: testData,
                series: [{ type: 'bar', xKey: 'x', yKey: 'y' }],
            });

            const chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            expect(chart.series.length).toBe(1);
            expect(chart.series[0].focusable).toBe(true);

            chart.destroy();
        });

        it('should have focusable === true for area series', async () => {
            const options: AgChartOptions = prepareTestOptions({
                data: testData,
                series: [{ type: 'area', xKey: 'x', yKey: 'y' }],
            });

            const chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            expect(chart.series.length).toBe(1);
            expect(chart.series[0].focusable).toBe(true);

            chart.destroy();
        });

        it('should have focusable === true for scatter series', async () => {
            const options: AgChartOptions = prepareTestOptions({
                data: testData,
                series: [{ type: 'scatter', xKey: 'x', yKey: 'y' }],
            });

            const chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            expect(chart.series.length).toBe(1);
            expect(chart.series[0].focusable).toBe(true);

            chart.destroy();
        });

        it('should have focusable === true for bubble series', async () => {
            const options: AgChartOptions = prepareTestOptions({
                data: testData,
                series: [{ type: 'bubble', xKey: 'x', yKey: 'y', sizeKey: 'z' }],
            });

            const chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            expect(chart.series.length).toBe(1);
            expect(chart.series[0].focusable).toBe(true);

            chart.destroy();
        });

        it('should have focusable === true for multiple series', async () => {
            const options: AgChartOptions = prepareTestOptions({
                data: testData,
                series: [
                    { type: 'line', xKey: 'x', yKey: 'y' },
                    { type: 'bar', xKey: 'x', yKey: 'z' },
                    { type: 'area', xKey: 'x', yKey: 'y' },
                ],
            });

            const chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            expect(chart.series.length).toBe(3);
            for (const series of chart.series) {
                expect(series.focusable).toBe(true);
            }

            chart.destroy();
        });

        it('should have focusable === true for pie series', async () => {
            const pieData = [
                { category: 'A', value: 10 },
                { category: 'B', value: 20 },
                { category: 'C', value: 15 },
            ];

            const options: AgChartOptions = prepareTestOptions({
                data: pieData,
                series: [{ type: 'pie', angleKey: 'value', calloutLabelKey: 'category' }],
            });

            const chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            expect(chart.series.length).toBe(1);
            expect(chart.series[0].focusable).toBe(true);

            chart.destroy();
        });

        it('should have focusable === true for donut series', async () => {
            const donutData = [
                { category: 'A', value: 10 },
                { category: 'B', value: 20 },
                { category: 'C', value: 15 },
            ];

            const options: AgChartOptions = prepareTestOptions({
                data: donutData,
                series: [{ type: 'donut', angleKey: 'value', calloutLabelKey: 'category' }],
            });

            const chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            expect(chart.series.length).toBe(1);
            expect(chart.series[0].focusable).toBe(true);

            chart.destroy();
        });

        it('should maintain focusable === true for multiple series', async () => {
            const options: AgChartOptions = prepareTestOptions({
                data: testData,
                series: [
                    { type: 'line', xKey: 'x', yKey: 'y' },
                    { type: 'line', xKey: 'x', yKey: 'z' },
                ],
            });

            const chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            // All series should have focusable === true
            expect(chart.series[0].focusable).toBe(true);
            expect(chart.series[1].focusable).toBe(true);

            chart.destroy();
        });

        it('should have focusable === true for histogram series', async () => {
            const histogramData = Array.from({ length: 100 }, () => ({
                value: Math.random() * 100,
            }));

            const options: AgChartOptions = prepareTestOptions({
                data: histogramData,
                series: [{ type: 'histogram', xKey: 'value' }],
            });

            const chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            expect(chart.series.length).toBe(1);
            expect(chart.series[0].focusable).toBe(true);

            chart.destroy();
        });
    });
});
