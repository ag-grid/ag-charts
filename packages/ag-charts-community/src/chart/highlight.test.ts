import { afterEach, describe, expect, it, jest } from '@jest/globals';

import type { AgCartesianChartOptions, AgChartOptions, AgPolarChartOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../core/eventsHub';
import type { Chart } from './chart';
import type { DatumIndexType } from './series/seriesTypes';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    createChart,
    extractImageData,
    hoverAction,
    prepareTestOptions,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from './test/utils';

describe('Chart highlighting', () => {
    setupMockConsole();

    let chart: Chart;
    const ctx = setupMockCanvas();

    afterEach(() => {
        if (chart) {
            chart.destroy();
            (chart as unknown) = undefined;
        }
    });

    const compare = async () => {
        await waitForChartStability(chart);

        const imageData = extractImageData(ctx);
        expect(imageData).toMatchImageSnapshot(IMAGE_SNAPSHOT_DEFAULTS);
    };

    it('Handles bringToFront property', async () => {
        const options = prepareTestOptions<AgCartesianChartOptions>({
            data: [
                { x: 'A', line1: 10, line2: 5, bar: 20 },
                { x: 'B', line1: 15, line2: 15, bar: 25 },
                { x: 'C', line1: 20, line2: 20, bar: 30 },
            ],
            series: [
                { type: 'bar', xKey: 'x', yKey: 'bar', highlight: { bringToFront: false } },
                { type: 'line', xKey: 'x', yKey: 'line1', highlight: { bringToFront: false } },
                { type: 'line', xKey: 'x', yKey: 'line2', highlight: { bringToFront: false } },
            ],
        });

        chart = await createChart(options);
        await waitForChartStability(chart);

        // Yellow line, green line, red bar
        await hoverAction(170, 350)(chart);
        await waitForChartStability(chart);
        await compare();

        // Green line, yellow line, red bar
        await hoverAction(170, 430)(chart);
        await waitForChartStability(chart);
        await compare();

        // Red bar, yellow line, green line
        await hoverAction(170, 450)(chart);
        await waitForChartStability(chart);
        await compare();
    });

    type HighlightGetter = (chart: Chart) => HighlightNodeDatum<DatumIndexType> | undefined;

    type HighlightTestCase = {
        name: string;
        options: AgChartOptions;
        seriesIndex?: number;
        datumIndex?: number;
        getDatum?: HighlightGetter;
    };

    const defaultHighlightDatum = (
        chartInstance: Chart,
        testCase: HighlightTestCase
    ): HighlightNodeDatum<DatumIndexType> | undefined => {
        const seriesIndex = testCase.seriesIndex ?? 0;
        const datumIndex = testCase.datumIndex ?? 0;
        const series = chartInstance.series[seriesIndex] as unknown as {
            contextNodeData?: unknown;
            _contextNodeData?: unknown;
        };
        const context =
            series?.contextNodeData ?? (series as any)?.['contextNodeData'] ?? (series as any)._contextNodeData;

        if (!context) {
            const fallback = (series as any).getNodeData?.() as HighlightNodeDatum<DatumIndexType>[] | undefined;
            return fallback?.[datumIndex] ?? fallback?.[0];
        }

        const pickFromEntry = (entry: { nodeData?: HighlightNodeDatum<DatumIndexType>[] } | undefined) =>
            entry?.nodeData?.[datumIndex] ?? entry?.nodeData?.[0];

        if (Array.isArray(context)) {
            for (const entry of context as Array<{ nodeData?: HighlightNodeDatum<DatumIndexType>[] }>) {
                const candidate = pickFromEntry(entry);
                if (candidate) return candidate;
            }
            const fallback = (series as any).getNodeData?.() as HighlightNodeDatum<DatumIndexType>[] | undefined;
            return fallback?.[datumIndex] ?? fallback?.[0];
        }

        const candidate = pickFromEntry(context as { nodeData?: HighlightNodeDatum<DatumIndexType>[] });
        if (candidate) return candidate;

        const fallback = (series as any).getNodeData?.() as HighlightNodeDatum<DatumIndexType>[] | undefined;
        return fallback?.[datumIndex] ?? fallback?.[0];
    };

    const runHighlightSnapshot = async (testCase: HighlightTestCase) => {
        chart = await createChart(testCase.options);
        const highlightDatum = testCase.getDatum?.(chart) ?? defaultHighlightDatum(chart, testCase);
        if (highlightDatum == null) {
            throw new Error(`No highlight datum found for test case: ${testCase.name}`);
        }
        chart.ctx.highlightManager.updateHighlight(chart.id, highlightDatum);
        await compare();
    };

    const categoryData = [
        { category: 'Q1', apples: 5, oranges: 3 },
        { category: 'Q2', apples: 7, oranges: 4 },
        { category: 'Q3', apples: 6, oranges: 5 },
        { category: 'Q4', apples: 8, oranges: 6 },
    ];

    const cartesianSeriesData = [
        { x: 0, seriesA: 4, seriesB: 2 },
        { x: 1, seriesA: 7, seriesB: 3 },
        { x: 2, seriesA: 5, seriesB: 4 },
        { x: 3, seriesA: 8, seriesB: 6 },
    ];

    const scatterData = [
        { x: 1, scatterA: 4, scatterB: 2, labelA: 'A', labelB: 'A*', sizeA: 12, sizeB: 8 },
        { x: 2, scatterA: 6, scatterB: 4, labelA: 'B', labelB: 'B*', sizeA: 16, sizeB: 12 },
        { x: 3, scatterA: 5, scatterB: 3, labelA: 'C', labelB: 'C*', sizeA: 14, sizeB: 10 },
        { x: 4, scatterA: 7, scatterB: 5, labelA: 'D', labelB: 'D*', sizeA: 18, sizeB: 14 },
    ];

    const histogramData = [
        { value: 3 },
        { value: 5 },
        { value: 7 },
        { value: 6 },
        { value: 8 },
        { value: 9 },
        { value: 11 },
        { value: 10 },
    ];

    const partWholeData = [
        { label: 'Alpha', value: 35 },
        { label: 'Beta', value: 28 },
        { label: 'Gamma', value: 22 },
        { label: 'Delta', value: 15 },
    ];

    const multiSeriesCases: HighlightTestCase[] = [
        {
            name: 'bar',
            options: {
                data: categoryData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                series: [
                    { type: 'bar', xKey: 'category', yKey: 'apples', label: { enabled: true } },
                    { type: 'bar', xKey: 'category', yKey: 'oranges', label: { enabled: true } },
                ],
            } as AgCartesianChartOptions,
            seriesIndex: 0,
            datumIndex: 1,
        },
        {
            name: 'line',
            options: {
                data: cartesianSeriesData,
                axes: {
                    x: { position: 'bottom', type: 'number' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                series: [
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'seriesA',
                        marker: { enabled: true, size: 10 },
                        label: { enabled: true },
                    },
                    {
                        type: 'line',
                        xKey: 'x',
                        yKey: 'seriesB',
                        marker: { enabled: true, size: 10 },
                        label: { enabled: true },
                    },
                ],
            } as AgCartesianChartOptions,
            seriesIndex: 0,
            datumIndex: 2,
        },
        {
            name: 'area',
            options: {
                data: cartesianSeriesData,
                axes: {
                    x: { position: 'bottom', type: 'number' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                series: [
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'seriesA',
                        stacked: false,
                        marker: { enabled: true, size: 8 },
                        label: { enabled: true },
                    },
                    {
                        type: 'area',
                        xKey: 'x',
                        yKey: 'seriesB',
                        stacked: false,
                        marker: { enabled: true, size: 8 },
                        label: { enabled: true },
                    },
                ],
            } as AgCartesianChartOptions,
            seriesIndex: 0,
            datumIndex: 2,
        },
        {
            name: 'scatter',
            options: {
                data: scatterData,
                axes: {
                    x: { position: 'bottom', type: 'number' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                series: [
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'scatterA',
                        labelKey: 'labelA',
                        size: 15,
                        label: { enabled: true },
                    },
                    {
                        type: 'scatter',
                        xKey: 'x',
                        yKey: 'scatterB',
                        labelKey: 'labelB',
                        size: 15,
                        label: { enabled: true },
                    },
                ],
            } as AgCartesianChartOptions,
            seriesIndex: 0,
            datumIndex: 1,
        },
        {
            name: 'bubble',
            options: {
                data: scatterData,
                axes: {
                    x: { position: 'bottom', type: 'number' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                series: [
                    {
                        type: 'bubble',
                        xKey: 'x',
                        yKey: 'scatterA',
                        sizeKey: 'sizeA',
                        labelKey: 'labelA',
                        label: { enabled: true },
                    },
                    {
                        type: 'bubble',
                        xKey: 'x',
                        yKey: 'scatterB',
                        sizeKey: 'sizeB',
                        labelKey: 'labelB',
                        label: { enabled: true },
                    },
                ],
            } as AgCartesianChartOptions,
            seriesIndex: 0,
            datumIndex: 1,
        },
    ];

    const singleSeriesCases: HighlightTestCase[] = [
        {
            name: 'histogram',
            options: {
                data: histogramData,
                axes: {
                    x: { position: 'bottom', type: 'number' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                series: [
                    {
                        type: 'histogram',
                        xKey: 'value',
                        binCount: 4,
                        label: { enabled: true },
                    },
                ],
            } as AgCartesianChartOptions,
            seriesIndex: 0,
            datumIndex: 1,
        },
    ];

    const partWholeCases: HighlightTestCase[] = [
        {
            name: 'pie',
            options: {
                data: partWholeData,
                legend: { enabled: false },
                series: [
                    {
                        type: 'pie',
                        angleKey: 'value',
                        calloutLabelKey: 'label',
                        sectorLabelKey: 'label',
                        calloutLabel: { enabled: true },
                        sectorLabel: { enabled: true },
                    },
                ],
            } as AgPolarChartOptions,
            seriesIndex: 0,
            datumIndex: 2,
        },
        {
            name: 'donut',
            options: {
                data: partWholeData,
                legend: { enabled: false },
                series: [
                    {
                        type: 'donut',
                        angleKey: 'value',
                        calloutLabelKey: 'label',
                        sectorLabelKey: 'label',
                        calloutLabel: { enabled: true },
                        sectorLabel: { enabled: true },
                        innerRadiusRatio: 0.6,
                    },
                ],
            } as AgPolarChartOptions,
            seriesIndex: 0,
            datumIndex: 1,
        },
    ];

    describe('Default highlight dimming', () => {
        describe('multi series', () => {
            for (const testCase of multiSeriesCases) {
                it(`${testCase.name} series dims unhighlighted items`, async () => {
                    await runHighlightSnapshot(testCase);
                });
            }
        });

        describe('single series', () => {
            for (const testCase of singleSeriesCases) {
                it(`${testCase.name} series dims unhighlighted items`, async () => {
                    await runHighlightSnapshot(testCase);
                });
            }
        });

        describe('part/whole series', () => {
            for (const testCase of partWholeCases) {
                it(`${testCase.name} series dims unhighlighted items`, async () => {
                    await runHighlightSnapshot(testCase);
                });
            }
        });
    });

    describe('Highlight disabled series', () => {
        it('ignores highlight on a series with highlight.enabled = false', async () => {
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: categoryData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                series: [
                    {
                        type: 'bar',
                        xKey: 'category',
                        yKey: 'apples',
                        label: { enabled: true },
                        highlight: {
                            enabled: false,
                        },
                    },
                    {
                        type: 'bar',
                        xKey: 'category',
                        yKey: 'oranges',
                        label: { enabled: true },
                    },
                ],
            });

            await runHighlightSnapshot({
                name: 'disabled-series-highlight-ignored',
                options,
                seriesIndex: 0,
                datumIndex: 2,
            });
        });

        it('dims other enabled series when transitioning from disabled to enabled series', async () => {
            const threeSeriesData = [
                { category: 'Q1', apples: 5, oranges: 3, bananas: 4 },
                { category: 'Q2', apples: 7, oranges: 4, bananas: 5 },
                { category: 'Q3', apples: 6, oranges: 5, bananas: 4 },
                { category: 'Q4', apples: 8, oranges: 6, bananas: 7 },
            ];

            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: threeSeriesData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                series: [
                    {
                        type: 'bar',
                        xKey: 'category',
                        yKey: 'apples',
                        label: { enabled: true },
                        highlight: { enabled: false },
                    },
                    {
                        type: 'bar',
                        xKey: 'category',
                        yKey: 'oranges',
                        label: { enabled: true },
                    },
                    {
                        type: 'bar',
                        xKey: 'category',
                        yKey: 'bananas',
                        label: { enabled: true },
                    },
                ],
            });

            chart = await createChart(options);

            // First highlight the disabled series (apples)
            const disabledDatum = defaultHighlightDatum(chart, {
                name: 'disabled',
                options,
                seriesIndex: 0,
                datumIndex: 0,
            });
            chart.ctx.highlightManager.updateHighlight(chart.id, disabledDatum);
            await waitForChartStability(chart);

            // Now transition to an enabled series (oranges) — bananas should dehighlight
            const enabledDatum = defaultHighlightDatum(chart, {
                name: 'enabled',
                options,
                seriesIndex: 1,
                datumIndex: 0,
            });
            chart.ctx.highlightManager.updateHighlight(chart.id, enabledDatum);
            await compare();
        });

        it('clears dehighlight on all series when transitioning from enabled to disabled series', async () => {
            const threeSeriesData = [
                { category: 'Q1', apples: 5, oranges: 3, bananas: 4 },
                { category: 'Q2', apples: 7, oranges: 4, bananas: 5 },
                { category: 'Q3', apples: 6, oranges: 5, bananas: 4 },
                { category: 'Q4', apples: 8, oranges: 6, bananas: 7 },
            ];

            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: threeSeriesData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                series: [
                    {
                        type: 'bar',
                        xKey: 'category',
                        yKey: 'apples',
                        label: { enabled: true },
                        highlight: { enabled: false },
                    },
                    {
                        type: 'bar',
                        xKey: 'category',
                        yKey: 'oranges',
                        label: { enabled: true },
                    },
                    {
                        type: 'bar',
                        xKey: 'category',
                        yKey: 'bananas',
                        label: { enabled: true },
                    },
                ],
            });

            chart = await createChart(options);

            // First highlight an enabled series (oranges) — bananas should dehighlight
            const enabledDatum = defaultHighlightDatum(chart, {
                name: 'enabled',
                options,
                seriesIndex: 1,
                datumIndex: 0,
            });
            chart.ctx.highlightManager.updateHighlight(chart.id, enabledDatum);
            await waitForChartStability(chart);

            // Now transition to the disabled series (apples) — all series should clear dehighlight
            const disabledDatum = defaultHighlightDatum(chart, {
                name: 'disabled',
                options,
                seriesIndex: 0,
                datumIndex: 0,
            });
            chart.ctx.highlightManager.updateHighlight(chart.id, disabledDatum);
            await compare();
        });

        it('does not dim disabled series when another series is highlighted', async () => {
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: categoryData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                series: [
                    {
                        type: 'bar',
                        xKey: 'category',
                        yKey: 'apples',
                        label: { enabled: true },
                    },
                    {
                        type: 'bar',
                        xKey: 'category',
                        yKey: 'oranges',
                        label: { enabled: true },
                        highlight: {
                            enabled: false,
                        },
                    },
                ],
            });

            await runHighlightSnapshot({
                name: 'disabled-series-no-dim',
                options,
                seriesIndex: 0,
                datumIndex: 1,
            });
        });
    });

    describe('Delayed unhighlight', () => {
        afterEach(() => {
            jest.useRealTimers();
        });

        it('highlighting is immediate with no delay', async () => {
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: categoryData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                series: [{ type: 'bar', xKey: 'category', yKey: 'apples' }],
            });

            chart = await createChart(options);
            await waitForChartStability(chart);

            // Enable fake timers
            jest.useFakeTimers();

            const highlightManager = chart.ctx.highlightManager;
            const callerId = chart.id;
            const datum = defaultHighlightDatum(chart, {
                name: 'test',
                options,
                seriesIndex: 0,
                datumIndex: 0,
            });
            expect(datum).toBeDefined();

            // Highlight directly (should be immediate, no delay)
            highlightManager.updateHighlight(callerId, datum);

            // Verify highlight is active immediately (no timer advancement needed)
            const highlightedNode = highlightManager.getActiveHighlight();
            expect(highlightedNode).toBeDefined();
            expect(highlightedNode).toBe(datum);
        });

        it('unhighlighting is delayed by 100ms', async () => {
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: categoryData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                series: [{ type: 'bar', xKey: 'category', yKey: 'apples' }],
            });

            chart = await createChart(options);
            await waitForChartStability(chart);

            // Enable fake timers
            jest.useFakeTimers();

            const highlightManager = chart.ctx.highlightManager;
            const callerId = chart.id;
            const datum = defaultHighlightDatum(chart, {
                name: 'test',
                options,
                seriesIndex: 0,
                datumIndex: 0,
            });
            expect(datum).toBeDefined();

            // Highlight a bar
            highlightManager.updateHighlight(callerId, datum);
            expect(highlightManager.getActiveHighlight()).toBeDefined();

            // Unhighlight with delayed=true (schedules delayed unhighlight)
            highlightManager.updateHighlight(callerId, undefined, true);

            // Immediately check - should still be highlighted
            expect(highlightManager.getActiveHighlight()).toBeDefined();

            // Advance timer by 50ms - still highlighted (delay is 100ms)
            jest.advanceTimersByTime(50);
            expect(highlightManager.getActiveHighlight()).toBeDefined();

            // Advance timer by another 60ms (total 110ms) - now unhighlighted
            jest.advanceTimersByTime(60);
            expect(highlightManager.getActiveHighlight()).toBeUndefined();
        });

        it('highlighting new item cancels pending unhighlight for same caller', async () => {
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: categoryData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                series: [{ type: 'bar', xKey: 'category', yKey: 'apples' }],
            });

            chart = await createChart(options);
            await waitForChartStability(chart);

            // Enable fake timers after chart creation
            jest.useFakeTimers();

            const highlightManager = chart.ctx.highlightManager;
            const callerId = chart.id;

            // Get a datum to highlight
            const datum = defaultHighlightDatum(chart, {
                name: 'test',
                options,
                seriesIndex: 0,
                datumIndex: 0,
            });
            expect(datum).toBeDefined();

            // Highlight bar 1
            highlightManager.updateHighlight(callerId, datum);
            const firstHighlight = highlightManager.getActiveHighlight();
            expect(firstHighlight).toBeDefined();

            // Unhighlight with delayed=true (triggers pending unhighlight)
            highlightManager.updateHighlight(callerId, undefined, true);

            // Advance timer by 30ms (less than 100ms delay)
            jest.advanceTimersByTime(30);

            // Re-highlight before unhighlight completes - should cancel pending unhighlight
            highlightManager.updateHighlight(callerId, datum);
            const secondHighlight = highlightManager.getActiveHighlight();

            // Should immediately switch to highlighted state
            expect(secondHighlight).toBeDefined();
            expect(secondHighlight).toBe(datum);

            // Advance timer by remaining 70ms (total 100ms) - should still be highlighted
            jest.advanceTimersByTime(70);
            expect(highlightManager.getActiveHighlight()).toBeDefined();
            expect(highlightManager.getActiveHighlight()).toBe(datum);
        });

        it('multiple callers can have independent pending unhighlights', async () => {
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: categoryData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                series: [{ type: 'bar', xKey: 'category', yKey: 'apples' }],
            });

            chart = await createChart(options);
            await waitForChartStability(chart);

            // Enable fake timers after chart creation
            jest.useFakeTimers();

            const highlightManager = chart.ctx.highlightManager;
            const callerA = 'callerA';
            const callerB = 'callerB';

            // Get data to highlight
            const datumA = defaultHighlightDatum(chart, {
                name: 'test',
                options,
                seriesIndex: 0,
                datumIndex: 0,
            });
            const datumB = defaultHighlightDatum(chart, {
                name: 'test',
                options,
                seriesIndex: 0,
                datumIndex: 1,
            });
            expect(datumA).toBeDefined();
            expect(datumB).toBeDefined();

            // Caller A highlights
            highlightManager.updateHighlight(callerA, datumA);
            expect(highlightManager.getActiveHighlight()).toBe(datumA);

            // Caller B highlights (should override A)
            highlightManager.updateHighlight(callerB, datumB);
            expect(highlightManager.getActiveHighlight()).toBe(datumB);

            // Caller A unhighlights with delayed=true (schedules delayed unhighlight for A)
            highlightManager.updateHighlight(callerA, undefined, true);
            // B should still be active (A's entry is still in StateTracker until delay fires)
            expect(highlightManager.getActiveHighlight()).toBe(datumB);

            // Advance timer by 100ms - A's unhighlight fires, clearing A's entry
            jest.advanceTimersByTime(100);
            // B should still be active (only A's entry was cleared)
            expect(highlightManager.getActiveHighlight()).toBe(datumB);

            // Now caller B unhighlights with delayed=true (schedules delayed unhighlight for B)
            highlightManager.updateHighlight(callerB, undefined, true);
            // Should still show B (delay pending)
            expect(highlightManager.getActiveHighlight()).toBe(datumB);

            // Advance timer by 100ms - B's unhighlight fires
            jest.advanceTimersByTime(100);
            // Now should be unhighlighted
            expect(highlightManager.getActiveHighlight()).toBeUndefined();
        });

        it("highlighting from one caller does not cancel another caller's pending unhighlight", async () => {
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: categoryData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                series: [{ type: 'bar', xKey: 'category', yKey: 'apples' }],
            });

            chart = await createChart(options);
            await waitForChartStability(chart);

            // Enable fake timers after chart creation
            jest.useFakeTimers();

            const highlightManager = chart.ctx.highlightManager;
            const callerA = 'callerA';
            const callerB = 'callerB';

            // Get data to highlight
            const datumA = defaultHighlightDatum(chart, {
                name: 'test',
                options,
                seriesIndex: 0,
                datumIndex: 0,
            });
            const datumB = defaultHighlightDatum(chart, {
                name: 'test',
                options,
                seriesIndex: 0,
                datumIndex: 1,
            });
            expect(datumA).toBeDefined();
            expect(datumB).toBeDefined();

            // Caller A highlights
            highlightManager.updateHighlight(callerA, datumA);
            expect(highlightManager.getActiveHighlight()).toBe(datumA);

            // Caller A unhighlights with delayed=true (schedules delayed unhighlight)
            highlightManager.updateHighlight(callerA, undefined, true);
            expect(highlightManager.getActiveHighlight()).toBe(datumA); // Still active due to delay

            // Advance timer by 30ms
            jest.advanceTimersByTime(30);

            // Caller B highlights (should NOT cancel A's pending unhighlight)
            highlightManager.updateHighlight(callerB, datumB);
            expect(highlightManager.getActiveHighlight()).toBe(datumB);

            // Advance timer by 70ms (total 100ms) - A's unhighlight should fire
            jest.advanceTimersByTime(70);
            // B should still be active (A's entry cleared, but B remains)
            expect(highlightManager.getActiveHighlight()).toBe(datumB);
        });

        it('unhighlighting is immediate when delayed=false', async () => {
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: categoryData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                series: [{ type: 'bar', xKey: 'category', yKey: 'apples' }],
            });

            chart = await createChart(options);
            await waitForChartStability(chart);

            // Enable fake timers
            jest.useFakeTimers();

            const highlightManager = chart.ctx.highlightManager;
            const callerId = chart.id;
            const datum = defaultHighlightDatum(chart, {
                name: 'test',
                options,
                seriesIndex: 0,
                datumIndex: 0,
            });
            expect(datum).toBeDefined();

            // Highlight a bar
            highlightManager.updateHighlight(callerId, datum);
            expect(highlightManager.getActiveHighlight()).toBeDefined();

            // Unhighlight with delayed=false (immediate unhighlight)
            highlightManager.updateHighlight(callerId, undefined, false);

            // Should be immediately unhighlighted (no wait needed)
            expect(highlightManager.getActiveHighlight()).toBeUndefined();
        });

        it('immediate unhighlight cancels pending delayed unhighlight', async () => {
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: categoryData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                series: [{ type: 'bar', xKey: 'category', yKey: 'apples' }],
            });

            chart = await createChart(options);
            await waitForChartStability(chart);

            // Enable fake timers
            jest.useFakeTimers();

            const highlightManager = chart.ctx.highlightManager;
            const callerId = chart.id;
            const datum = defaultHighlightDatum(chart, {
                name: 'test',
                options,
                seriesIndex: 0,
                datumIndex: 0,
            });
            expect(datum).toBeDefined();

            // Highlight a bar
            highlightManager.updateHighlight(callerId, datum);
            expect(highlightManager.getActiveHighlight()).toBeDefined();

            // Trigger delayed unhighlight
            highlightManager.updateHighlight(callerId, undefined, true);

            // Wait 50ms
            jest.advanceTimersByTime(50);
            expect(highlightManager.getActiveHighlight()).toBeDefined();

            // Trigger immediate unhighlight before delay completes
            highlightManager.updateHighlight(callerId, undefined, false);

            // Should be immediately unhighlighted
            expect(highlightManager.getActiveHighlight()).toBeUndefined();

            // Wait for original delay period
            jest.advanceTimersByTime(100);

            // Should still be unhighlighted (no double-unhighlight)
            expect(highlightManager.getActiveHighlight()).toBeUndefined();
        });

        it('repeated delayed unhighlight calls do not reset countdown', async () => {
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: categoryData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                series: [{ type: 'bar', xKey: 'category', yKey: 'apples' }],
            });

            chart = await createChart(options);
            await waitForChartStability(chart);

            // Enable fake timers
            jest.useFakeTimers();

            const highlightManager = chart.ctx.highlightManager;
            const callerId = chart.id;
            const datum = defaultHighlightDatum(chart, {
                name: 'test',
                options,
                seriesIndex: 0,
                datumIndex: 0,
            });
            expect(datum).toBeDefined();

            // Highlight a bar
            highlightManager.updateHighlight(callerId, datum);
            expect(highlightManager.getActiveHighlight()).toBeDefined();

            // First delayed unhighlight call - starts countdown
            highlightManager.updateHighlight(callerId, undefined, true);

            // Wait 50ms (halfway through 100ms countdown)
            jest.advanceTimersByTime(50);
            expect(highlightManager.getActiveHighlight()).toBeDefined();

            // Second delayed unhighlight call - should NOT reset countdown
            highlightManager.updateHighlight(callerId, undefined, true);

            // Wait another 30ms (total 80ms from first call, 30ms from second call)
            jest.advanceTimersByTime(30);

            // Third delayed unhighlight call - should still NOT reset countdown
            highlightManager.updateHighlight(callerId, undefined, true);

            // Wait another 25ms (total 105ms from first call, 55ms from second, 25ms from third)
            jest.advanceTimersByTime(25);

            // Should be unhighlighted now (100ms from FIRST call has elapsed)
            expect(highlightManager.getActiveHighlight()).toBeUndefined();
        });

        it('multiple rapid highlight/unhighlight cycles work correctly', async () => {
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: categoryData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                series: [{ type: 'bar', xKey: 'category', yKey: 'apples' }],
            });

            chart = await createChart(options);
            await waitForChartStability(chart);

            // Enable fake timers after chart creation
            jest.useFakeTimers();

            const highlightManager = chart.ctx.highlightManager;
            const callerId = chart.id;
            const datum = defaultHighlightDatum(chart, {
                name: 'test',
                options,
                seriesIndex: 0,
                datumIndex: 0,
            });
            expect(datum).toBeDefined();

            // Rapidly hover and unhover multiple times
            highlightManager.updateHighlight(callerId, datum);
            expect(highlightManager.getActiveHighlight()).toBeDefined();

            highlightManager.updateHighlight(callerId, undefined, true); // Unhighlight with delayed=true
            jest.advanceTimersByTime(50);
            highlightManager.updateHighlight(callerId, datum); // Re-hover before delay completes
            expect(highlightManager.getActiveHighlight()).toBeDefined();

            highlightManager.updateHighlight(callerId, undefined, true); // Unhover again with delayed=true
            jest.advanceTimersByTime(50);
            highlightManager.updateHighlight(callerId, datum); // Re-hover again
            expect(highlightManager.getActiveHighlight()).toBeDefined();

            // Final unhover with delayed=true and advance timer
            highlightManager.updateHighlight(callerId, undefined, true);
            jest.advanceTimersByTime(150);
            expect(highlightManager.getActiveHighlight()).toBeUndefined();
        });
    });
});
