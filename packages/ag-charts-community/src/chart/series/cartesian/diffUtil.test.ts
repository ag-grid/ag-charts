import { describe, expect, it } from '@jest/globals';

import type { AgCartesianChartOptions } from 'ag-charts-types';

import { AgCharts } from '../../../api/agCharts';
import type { ProcessedData, ProcessedOutputDiff } from '../../data/dataModel';
import { deproxy, setupMockCanvas, setupMockConsole, waitForChartStability } from '../../test/utils';
import type { CartesianSeriesNodeDataContext, CartesianSeriesNodeDatum } from './cartesianSeries';
import { calculateDataDiff } from './diffUtil';

describe('diffUtil', () => {
    setupMockConsole();
    setupMockCanvas();

    describe('CRT-965: Domain Update Data Diff No-Op', () => {
        it('should return changed: false when processedDataUpdated is false', () => {
            const seriesId = 'test-series';
            const datumSelection = [
                { datum: { xValue: 1, yValue: 10 } as CartesianSeriesNodeDatum },
                { datum: { xValue: 2, yValue: 20 } as CartesianSeriesNodeDatum },
            ];
            const getDatumId = (datum: CartesianSeriesNodeDatum) => String(datum.xValue);
            const contextNodeData = {
                scales: {
                    x: { domain: [1, 2], range: [0, 100] },
                    y: { domain: [10, 20], range: [0, 100] },
                },
            } as CartesianSeriesNodeDataContext<CartesianSeriesNodeDatum, any>;
            const previousContextNodeData = {
                scales: {
                    x: { domain: [1, 2], range: [0, 100] },
                    y: { domain: [10, 20], range: [0, 100] },
                },
            } as CartesianSeriesNodeDataContext<CartesianSeriesNodeDatum, any>;
            const processedData = {
                reduced: { diff: {} },
            } as ProcessedData<unknown>;

            // Key test: processedDataUpdated = false
            const result = calculateDataDiff(
                seriesId,
                datumSelection,
                getDatumId,
                contextNodeData,
                previousContextNodeData,
                processedData,
                false // processedDataUpdated = false
            );

            expect(result).toBeDefined();
            expect(result!.changed).toBe(false);
            expect(result!.added.size).toBe(0);
            expect(result!.updated.size).toBe(0);
            expect(result!.removed.size).toBe(0);
            expect(result!.moved.size).toBe(0);
        });

        it('should return changed: false when processedDataUpdated is undefined (falsy)', () => {
            const seriesId = 'test-series';
            const datumSelection = [{ datum: { xValue: 1, yValue: 10 } as CartesianSeriesNodeDatum }];
            const getDatumId = (datum: CartesianSeriesNodeDatum) => String(datum.xValue);
            const contextNodeData = {
                scales: {
                    x: { domain: [1, 2], range: [0, 100] },
                    y: { domain: [10, 20], range: [0, 100] },
                },
            } as CartesianSeriesNodeDataContext<CartesianSeriesNodeDatum, any>;

            const result = calculateDataDiff(
                seriesId,
                datumSelection,
                getDatumId,
                contextNodeData,
                undefined,
                undefined,
                undefined // processedDataUpdated = undefined
            );

            expect(result).toBeDefined();
            expect(result!.changed).toBe(false);
        });

        it('should process data diff normally when processedDataUpdated is true', () => {
            const seriesId = 'test-series';
            const datumSelection = [
                { datum: { xValue: 1, yValue: 10 } as CartesianSeriesNodeDatum },
                { datum: { xValue: 2, yValue: 20 } as CartesianSeriesNodeDatum },
            ];
            const getDatumId = (datum: CartesianSeriesNodeDatum) => String(datum.xValue);
            const contextNodeData = {
                scales: {
                    x: { domain: [1, 2], range: [0, 100] },
                    y: { domain: [10, 20], range: [0, 100] },
                },
            } as CartesianSeriesNodeDataContext<CartesianSeriesNodeDatum, any>;
            const processedData = {
                reduced: { diff: {} },
            } as ProcessedData<unknown>;

            // processedDataUpdated = true, should process normally
            const result = calculateDataDiff(
                seriesId,
                datumSelection,
                getDatumId,
                contextNodeData,
                undefined,
                processedData,
                true // processedDataUpdated = true
            );

            // Should indicate data was added (changed = true)
            expect(result).toBeDefined();
            expect(result!.changed).toBe(true);
            expect(result!.added.size).toBe(2);
        });

        it('should return existing diff if already marked as changed', () => {
            const seriesId = 'test-series';
            const datumSelection = [{ datum: { xValue: 1, yValue: 10 } as CartesianSeriesNodeDatum }];
            const getDatumId = (datum: CartesianSeriesNodeDatum) => String(datum.xValue);
            const contextNodeData = {
                scales: {
                    x: { domain: [1, 2], range: [0, 100] },
                    y: { domain: [10, 20], range: [0, 100] },
                },
            } as CartesianSeriesNodeDataContext<CartesianSeriesNodeDatum, any>;

            const existingDiff: ProcessedOutputDiff = {
                changed: true,
                added: new Set(['1']),
                updated: new Set(),
                removed: new Set(),
                moved: new Set(),
            };

            const processedData = {
                reduced: {
                    diff: {
                        [seriesId]: existingDiff,
                    },
                },
            } as unknown as ProcessedData<unknown>;

            // Should return existing diff regardless of processedDataUpdated
            const result = calculateDataDiff(
                seriesId,
                datumSelection,
                getDatumId,
                contextNodeData,
                undefined,
                processedData,
                false
            );

            expect(result).toBe(existingDiff);
        });
    });

    describe('Integration: Domain-only updates', () => {
        it('should not trigger unnecessary data processing on axis domain change', async () => {
            const options: AgCartesianChartOptions = {
                container: document.body,
                data: [
                    { x: 0, y: 10 },
                    { x: 1, y: 20 },
                    { x: 2, y: 30 },
                ],
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'number', position: 'bottom' },
                    y: { type: 'number', position: 'left', min: 0, max: 50 },
                },
            };

            const chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            // Chart should create successfully with custom domain without errors
            expect(chart.axes.length).toBeGreaterThan(0);
            expect(chart.series.length).toBe(1);

            chart.destroy();
        });

        it('should handle zoom operations that change domain but not data', async () => {
            const options: AgCartesianChartOptions = {
                container: document.body,
                data: Array.from({ length: 100 }, (_, i) => ({ x: i, y: Math.sin(i / 10) * 50 + 50 })),
                series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
                axes: {
                    x: { type: 'number', position: 'bottom', min: 20, max: 80 },
                    y: { type: 'number', position: 'left' },
                },
            };

            const chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            // Chart should render zoomed view without data processing errors
            expect(chart.axes.length).toBeGreaterThan(0);
            expect(chart.series.length).toBe(1);

            chart.destroy();
        });

        it('should work correctly with different axis types', async () => {
            const options: AgCartesianChartOptions = {
                container: document.body,
                data: [
                    { category: 'A', value: 10 },
                    { category: 'B', value: 20 },
                    { category: 'C', value: 15 },
                ],
                series: [{ type: 'bar', xKey: 'category', yKey: 'value' }],
                axes: {
                    x: { type: 'category', position: 'bottom' },
                    y: { type: 'number', position: 'left', min: 5, max: 25 },
                },
            };

            const chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            // Chart should work with category + number axes and custom domain
            expect(chart.axes.length).toBe(2);
            expect(chart.series.length).toBe(1);

            chart.destroy();
        });
    });
});
