import { afterEach, describe, expect, it } from '@jest/globals';

import type { AgChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../api/agCharts';
import type { Chart } from '../chart';
import {
    deproxy,
    hoverAction,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from '../test/utils';

describe('SeriesAreaManager', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: Chart;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    describe('CRT-869, CRT-901, CRT-871, CRT-909', () => {
        it('should render chart correctly when tooltips are globally disabled', async () => {
            const options: AgChartOptions = prepareTestOptions({
                data: [
                    { x: 0, y: 5 },
                    { x: 1, y: 10 },
                    { x: 2, y: 8 },
                ],
                series: [{ type: 'line', xKey: 'x', yKey: 'y', yName: 'Value' }],
                tooltip: {
                    enabled: false,
                },
            });

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            // Verify chart rendered successfully without errors
            expect(chart.series.length).toBe(1);
            expect(chart.tooltip.enabled).toBe(false);
        });

        it('should render chart correctly when tooltips are disabled per-series', async () => {
            const options: AgChartOptions = prepareTestOptions({
                data: [
                    { x: 0, y: 5, z: 3 },
                    { x: 1, y: 10, z: 7 },
                    { x: 2, y: 8, z: 5 },
                ],
                series: [
                    { type: 'line', xKey: 'x', yKey: 'y', yName: 'Enabled', tooltip: { enabled: true } },
                    { type: 'line', xKey: 'x', yKey: 'z', yName: 'Disabled', tooltip: { enabled: false } },
                ],
            });

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            // Verify both series rendered successfully
            expect(chart.series.length).toBe(2);

            // Hover over a data point to trigger tooltip logic
            await hoverAction(400, 300)(chart);
            await waitForChartStability(chart);

            // Chart should handle mixed tooltip settings without errors
            expect(chart.series.length).toBe(2);
        });

        it('should render chart correctly across multiple series types with disabled tooltips', async () => {
            const options: AgChartOptions = prepareTestOptions({
                data: [
                    { month: 'Jan', line: 10, bar: 15, area: 8 },
                    { month: 'Feb', line: 12, bar: 18, area: 10 },
                    { month: 'Mar', line: 15, bar: 20, area: 12 },
                ],
                series: [
                    { type: 'line', xKey: 'month', yKey: 'line', yName: 'Line' },
                    { type: 'bar', xKey: 'month', yKey: 'bar', yName: 'Bar' },
                    { type: 'area', xKey: 'month', yKey: 'area', yName: 'Area' },
                ],
                tooltip: {
                    enabled: false,
                },
            });

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            // All series should render correctly without errors
            expect(chart.series.length).toBe(3);
            expect(chart.tooltip.enabled).toBe(false);
        });

        it('should render tooltips correctly when enabled', async () => {
            const options: AgChartOptions = prepareTestOptions({
                data: [
                    { x: 0, y: 5 },
                    { x: 1, y: 10 },
                    { x: 2, y: 8 },
                ],
                series: [{ type: 'line', xKey: 'x', yKey: 'y', yName: 'Value' }],
                tooltip: {
                    enabled: true,
                },
            });

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            // Verify tooltip setting
            expect(chart.tooltip.enabled).toBe(true);

            // Hover to trigger tooltip
            await hoverAction(400, 300)(chart);
            await waitForChartStability(chart);

            // Chart should handle hover without errors
            expect(chart.series.length).toBe(1);
        });

        it('should handle hover interactions correctly with disabled tooltips', async () => {
            const options: AgChartOptions = prepareTestOptions({
                data: [
                    { x: 0, y: 5 },
                    { x: 1, y: 10 },
                    { x: 2, y: 8 },
                    { x: 3, y: 12 },
                ],
                series: [{ type: 'line', xKey: 'x', yKey: 'y', yName: 'Sales' }],
                tooltip: {
                    enabled: false,
                },
            });

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            // Simulate navigation (hover different points)
            await hoverAction(300, 300)(chart);
            await waitForChartStability(chart);

            await hoverAction(500, 200)(chart);
            await waitForChartStability(chart);

            // Chart should handle hover interactions without errors even with tooltips disabled
            expect(chart.tooltip.enabled).toBe(false);
            expect(chart.series.length).toBe(1);
        });
    });
});
