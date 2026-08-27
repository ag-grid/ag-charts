import { afterEach, describe, expect, it, vi } from 'vitest';

import type { AgCartesianChartOptions, AgChartOptions, AgPolarChartOptions } from 'ag-charts-types';

import type { HighlightNodeDatum } from '../core/eventsHub';
import type { Chart } from './chart';
import {
    IMAGE_SNAPSHOT_DEFAULTS,
    compareImageSnapshot,
    createChart,
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
        await compareImageSnapshot(chart, ctx, IMAGE_SNAPSHOT_DEFAULTS);
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

    type HighlightGetter = (chart: Chart) => HighlightNodeDatum | undefined;

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
    ): HighlightNodeDatum | undefined => {
        const seriesIndex = testCase.seriesIndex ?? 0;
        const datumIndex = testCase.datumIndex ?? 0;
        const series = chartInstance.series[seriesIndex] as unknown as {
            contextNodeData?: unknown;
            _contextNodeData?: unknown;
        };
        const context =
            series?.contextNodeData ?? (series as any)?.['contextNodeData'] ?? (series as any)._contextNodeData;

        if (!context) {
            const fallback = (series as any).getNodeData?.() as HighlightNodeDatum[] | undefined;
            return fallback?.[datumIndex] ?? fallback?.[0];
        }

        const pickFromEntry = (entry: { nodeData?: HighlightNodeDatum[] } | undefined) =>
            entry?.nodeData?.[datumIndex] ?? entry?.nodeData?.[0];

        if (Array.isArray(context)) {
            for (const entry of context as Array<{ nodeData?: HighlightNodeDatum[] }>) {
                const candidate = pickFromEntry(entry);
                if (candidate) return candidate;
            }
            const fallback = (series as any).getNodeData?.() as HighlightNodeDatum[] | undefined;
            return fallback?.[datumIndex] ?? fallback?.[0];
        }

        const candidate = pickFromEntry(context as { nodeData?: HighlightNodeDatum[] });
        if (candidate) return candidate;

        const fallback = (series as any).getNodeData?.() as HighlightNodeDatum[] | undefined;
        return fallback?.[datumIndex] ?? fallback?.[0];
    };

    // The base render layer of a cartesian series; the highlighted item itself is painted
    // separately by `highlightGroup`, so every base node reflects the "unhighlighted" style.
    const baseLayerFillOpacities = (chartInstance: Chart, seriesIndex: number): number[] => {
        const series = chartInstance.series[seriesIndex] as unknown as {
            datumSelection: { nodes(): Array<{ fillOpacity: number }> };
        };
        return series.datumSelection.nodes().map((node) => node.fillOpacity);
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

    describe('Chart-level highlight disabled', () => {
        it('ignores highlight on all series when chart highlight.enabled = false', async () => {
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: categoryData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                highlight: {
                    enabled: false,
                },
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
                    },
                ],
            });

            await runHighlightSnapshot({
                name: 'chart-highlight-disabled',
                options,
                seriesIndex: 0,
                datumIndex: 2,
            });
        });

        it('series highlight.enabled = true overrides chart highlight.enabled = false', async () => {
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: categoryData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                highlight: {
                    enabled: false,
                },
                series: [
                    {
                        type: 'bar',
                        xKey: 'category',
                        yKey: 'apples',
                        label: { enabled: true },
                        highlight: { enabled: true },
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
                name: 'chart-highlight-disabled-series-override',
                options,
                seriesIndex: 0,
                datumIndex: 2,
            });
        });

        const seriesHighlightEnabled = (chartInstance: Chart, seriesIndex: number) =>
            (chartInstance.series[seriesIndex] as unknown as { properties: { highlight: { enabled: boolean } } })
                .properties.highlight.enabled;

        it('cascades chart highlight.enabled = false to series that do not override it', async () => {
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: categoryData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                highlight: { enabled: false },
                series: [
                    { type: 'bar', xKey: 'category', yKey: 'apples' },
                    { type: 'bar', xKey: 'category', yKey: 'oranges', highlight: { enabled: true } },
                ],
            });

            chart = await createChart(options);
            await waitForChartStability(chart);

            expect(seriesHighlightEnabled(chart, 0)).toBe(false);
            expect(seriesHighlightEnabled(chart, 1)).toBe(true);
        });

        it('leaves series highlight.enabled = true by default when chart highlight is unset', async () => {
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: categoryData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                series: [{ type: 'bar', xKey: 'category', yKey: 'apples' }],
            });

            chart = await createChart(options);
            await waitForChartStability(chart);

            expect(seriesHighlightEnabled(chart, 0)).toBe(true);
        });
    });

    describe('Datum-level to series-level highlight transition', () => {
        // Legend items highlight at series level, with `datumIndex` set to NaN.
        const legendStyleHighlight = (series: Chart['series'][number], itemId: string): HighlightNodeDatum => ({
            series,
            itemId,
            datum: undefined,
            datumIndex: Number.NaN,
        });

        const twoSeriesOptions = () =>
            prepareTestOptions<AgCartesianChartOptions>({
                data: categoryData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                series: [
                    { type: 'bar', xKey: 'category', yKey: 'apples' },
                    { type: 'bar', xKey: 'category', yKey: 'oranges' },
                ],
            });

        it('clears item dimming when a datum highlight is replaced by a series highlight of the same series', async () => {
            const options = twoSeriesOptions();
            chart = await createChart(options);
            await waitForChartStability(chart);

            // Baseline: the bar theme's `unhighlightedItem`/`unhighlightedSeries` are not applied yet.
            expect(baseLayerFillOpacities(chart, 0)).toEqual([1, 1, 1, 1]);

            const datumHighlight = defaultHighlightDatum(chart, {
                name: 'datum-level',
                options,
                seriesIndex: 0,
                datumIndex: 1,
            });
            expect(datumHighlight).toBeDefined();

            // Datum-level highlight, as produced by hovering or arrow-key focusing a bar.
            chart.ctx.highlightManager.updateHighlight('series-area', datumHighlight);
            await waitForChartStability(chart);
            for (const fillOpacity of baseLayerFillOpacities(chart, 0)) {
                expect(fillOpacity).toBeLessThan(1);
            }

            // Series-level highlight of the same series, as when focus moves into a legend item.
            chart.ctx.highlightManager.updateHighlight('legend', legendStyleHighlight(chart.series[0], 'apples'));
            await waitForChartStability(chart);

            expect(baseLayerFillOpacities(chart, 0)).toEqual([1, 1, 1, 1]);
        });

        it('restores item dimming when a series highlight is replaced by a datum highlight of the same series', async () => {
            const options = twoSeriesOptions();
            chart = await createChart(options);
            await waitForChartStability(chart);

            chart.ctx.highlightManager.updateHighlight('legend', legendStyleHighlight(chart.series[0], 'apples'));
            await waitForChartStability(chart);
            expect(baseLayerFillOpacities(chart, 0)).toEqual([1, 1, 1, 1]);

            const datumHighlight = defaultHighlightDatum(chart, {
                name: 'datum-level',
                options,
                seriesIndex: 0,
                datumIndex: 1,
            });
            expect(datumHighlight).toBeDefined();

            chart.ctx.highlightManager.updateHighlight('series-area', datumHighlight);
            await waitForChartStability(chart);
            for (const fillOpacity of baseLayerFillOpacities(chart, 0)) {
                expect(fillOpacity).toBeLessThan(1);
            }
        });

        it('keeps other series dimmed across the transition', async () => {
            const options = twoSeriesOptions();
            chart = await createChart(options);
            await waitForChartStability(chart);

            const datumHighlight = defaultHighlightDatum(chart, {
                name: 'datum-level',
                options,
                seriesIndex: 0,
                datumIndex: 1,
            });

            chart.ctx.highlightManager.updateHighlight('series-area', datumHighlight);
            await waitForChartStability(chart);
            for (const fillOpacity of baseLayerFillOpacities(chart, 1)) {
                expect(fillOpacity).toBeLessThan(1);
            }

            chart.ctx.highlightManager.updateHighlight('legend', legendStyleHighlight(chart.series[0], 'apples'));
            await waitForChartStability(chart);
            for (const fillOpacity of baseLayerFillOpacities(chart, 1)) {
                expect(fillOpacity).toBeLessThan(1);
            }
        });

        it('hides the highlight overlay for a series-level highlight but shows it for a datum-level one', async () => {
            const options = twoSeriesOptions();
            chart = await createChart(options);
            await waitForChartStability(chart);

            const datumHighlight = defaultHighlightDatum(chart, {
                name: 'datum-level',
                options,
                seriesIndex: 0,
                datumIndex: 1,
            });

            chart.ctx.highlightManager.updateHighlight('series-area', datumHighlight);
            await waitForChartStability(chart);
            expect(chart.series[0].highlightGroup.visible).toBe(true);

            chart.ctx.highlightManager.updateHighlight('legend', legendStyleHighlight(chart.series[0], 'apples'));
            await waitForChartStability(chart);
            expect(chart.series[0].highlightGroup.visible).toBe(false);
        });
    });

    describe('highlight.mode: shared', () => {
        // Mirrors how `barSeries.ts#makeItemStylerParams` derives the string an `itemStyler` would see:
        // the currently active highlight, resolved through the same public `getHighlightStateString`.
        const stateAt = (chartInstance: Chart, seriesIndex: number, datumIndex: number, isHighlight = false) => {
            const activeHighlight = chartInstance.ctx.highlightManager.getActiveHighlight();
            return chartInstance.series[seriesIndex].getHighlightStateString(activeHighlight, isHighlight, datumIndex);
        };

        const twoBarSeriesOptions = (mode?: 'single' | 'shared') =>
            prepareTestOptions<AgCartesianChartOptions>({
                data: categoryData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                ...(mode ? { highlight: { mode } } : {}),
                series: [
                    { type: 'bar', xKey: 'category', yKey: 'apples' },
                    { type: 'bar', xKey: 'category', yKey: 'oranges' },
                ],
            });

        // The four rules the maintainer fixed on the ticket (David Glickman, 2026-08-26): the hovered item is
        // `highlighted-item`; the hovered series' own other items are `unhighlighted-item`; every other item in
        // the shared group is `highlighted-item`; every remaining item of a contributing series and every item
        // of a non-contributing series is `unhighlighted-series`.
        it('lights every item in the shared group exactly like the hovered one', async () => {
            const options = twoBarSeriesOptions('shared');
            chart = await createChart(options);
            await waitForChartStability(chart);

            const hoveredDatum = defaultHighlightDatum(chart, {
                name: 'q2-apples',
                options,
                seriesIndex: 0,
                datumIndex: 1,
            });
            expect(hoveredDatum).toBeDefined();

            chart.ctx.highlightManager.updateHighlight(chart.id, hoveredDatum);
            await waitForChartStability(chart);

            // The hovered node itself.
            expect(stateAt(chart, 0, 1, true)).toBe('highlighted-item');

            // The hovered series' own other items are unchanged from single mode.
            expect(stateAt(chart, 0, 0)).toBe('unhighlighted-item');
            expect(stateAt(chart, 0, 2)).toBe('unhighlighted-item');
            expect(stateAt(chart, 0, 3)).toBe('unhighlighted-item');

            // The non-hovered series' item at the same category (Q2) is lit exactly like the hovered one.
            expect(stateAt(chart, 1, 1)).toBe('highlighted-item');
            // Its other items remain series-dimmed.
            expect(stateAt(chart, 1, 0)).toBe('unhighlighted-series');
            expect(stateAt(chart, 1, 2)).toBe('unhighlighted-series');
            expect(stateAt(chart, 1, 3)).toBe('unhighlighted-series');
        });

        // The maintainer's two repros on the ticket (David Glickman, 2026-08-26) are both three stacked
        // series on one category axis - a shape the two-series cases here do not cover, and the only one
        // where the shared group spans more than one non-hovered series.
        const stackedReproData = [
            { quarter: 'Q1', apples: 5, oranges: 3, pears: 4 },
            { quarter: 'Q2', apples: 8, oranges: 6, pears: 2 },
            { quarter: 'Q3', apples: 4, oranges: 7, pears: 5 },
            { quarter: 'Q4', apples: 9, oranges: 2, pears: 3 },
        ];

        const stackedReproOptions = (seriesType: 'bar' | 'line') =>
            prepareTestOptions<AgCartesianChartOptions>({
                data: stackedReproData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                highlight: { mode: 'shared' },
                series: ['apples', 'oranges', 'pears'].map((yKey) => ({
                    type: seriesType,
                    xKey: 'quarter',
                    yKey,
                    stacked: true,
                })) as AgCartesianChartOptions['series'],
            });

        it.each(['bar', 'line'] as const)(
            'applies the four rules across three stacked %s series, hovering Pears in Q2',
            async (seriesType) => {
                const options = stackedReproOptions(seriesType);
                chart = await createChart(options);
                await waitForChartStability(chart);

                const hoveredDatum = defaultHighlightDatum(chart, {
                    name: `q2-pears-${seriesType}`,
                    options,
                    seriesIndex: 2,
                    datumIndex: 1,
                });
                expect(hoveredDatum).toBeDefined();

                chart.ctx.highlightManager.updateHighlight(chart.id, hoveredDatum);
                await waitForChartStability(chart);

                expect(stateAt(chart, 2, 1, true)).toBe('highlighted-item');
                expect(stateAt(chart, 2, 0)).toBe('unhighlighted-item');
                expect(stateAt(chart, 2, 2)).toBe('unhighlighted-item');
                expect(stateAt(chart, 2, 3)).toBe('unhighlighted-item');

                // Both other stacked series hold a Q2 item, so the shared group lights both...
                expect(stateAt(chart, 0, 1)).toBe('highlighted-item');
                expect(stateAt(chart, 1, 1)).toBe('highlighted-item');
                // ...and leaves the rest of each series dimmed.
                for (const seriesIndex of [0, 1]) {
                    for (const datumIndex of [0, 2, 3]) {
                        expect(stateAt(chart, seriesIndex, datumIndex)).toBe('unhighlighted-series');
                    }
                }
            }
        );

        it('leaves a series wholly unhighlighted-series when it has no item at the hovered category', async () => {
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: categoryData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                highlight: { mode: 'shared' },
                series: [
                    { type: 'bar', xKey: 'category', yKey: 'apples' },
                    {
                        type: 'bar',
                        xKey: 'category',
                        yKey: 'oranges',
                        // Omits the 'Q2' category the hover below targets.
                        data: categoryData.filter((d) => d.category !== 'Q2'),
                    },
                ],
            });

            chart = await createChart(options);
            await waitForChartStability(chart);

            const hoveredDatum = defaultHighlightDatum(chart, {
                name: 'q2-apples',
                options,
                seriesIndex: 0,
                datumIndex: 1,
            });
            expect(hoveredDatum).toBeDefined();

            chart.ctx.highlightManager.updateHighlight(chart.id, hoveredDatum);
            await waitForChartStability(chart);

            for (let datumIndex = 0; datumIndex < 3; datumIndex += 1) {
                expect(stateAt(chart, 1, datumIndex)).toBe('unhighlighted-series');
            }
        });

        it('matches on the category value, not the datum index, when a series omits an earlier category', async () => {
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: categoryData,
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                highlight: { mode: 'shared' },
                series: [
                    { type: 'bar', xKey: 'category', yKey: 'apples' },
                    {
                        type: 'bar',
                        xKey: 'category',
                        yKey: 'oranges',
                        // Drops 'Q2', so this series holds 'Q3' at index 1 where the hovered series holds it at 2.
                        data: categoryData.filter((d) => d.category !== 'Q2'),
                    },
                ],
            });

            chart = await createChart(options);
            await waitForChartStability(chart);

            const hoveredDatum = defaultHighlightDatum(chart, {
                name: 'q3-apples',
                options,
                seriesIndex: 0,
                datumIndex: 2,
            });
            expect(hoveredDatum).toBeDefined();

            chart.ctx.highlightManager.updateHighlight(chart.id, hoveredDatum);
            await waitForChartStability(chart);

            expect(stateAt(chart, 1, 1)).toBe('highlighted-item');
            expect(stateAt(chart, 1, 0)).toBe('unhighlighted-series');
            expect(stateAt(chart, 1, 2)).toBe('unhighlighted-series');
        });

        it('leaves a scatter series (no category concept) wholly unhighlighted-series', async () => {
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: cartesianSeriesData,
                axes: {
                    x: { position: 'bottom', type: 'number' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                highlight: { mode: 'shared' },
                series: [
                    { type: 'line', xKey: 'x', yKey: 'seriesA' },
                    { type: 'scatter', xKey: 'x', yKey: 'seriesB' },
                ],
            });

            chart = await createChart(options);
            await waitForChartStability(chart);

            const hoveredDatum = defaultHighlightDatum(chart, {
                name: 'line-datum',
                options,
                seriesIndex: 0,
                datumIndex: 1,
            });
            expect(hoveredDatum).toBeDefined();

            chart.ctx.highlightManager.updateHighlight(chart.id, hoveredDatum);
            await waitForChartStability(chart);

            for (let datumIndex = 0; datumIndex < cartesianSeriesData.length; datumIndex += 1) {
                expect(stateAt(chart, 1, datumIndex)).toBe('unhighlighted-series');
            }
        });

        it('is unaffected by a series-level (legend-focus) highlight, which carries a NaN datumIndex', async () => {
            const options = twoBarSeriesOptions('shared');
            chart = await createChart(options);
            await waitForChartStability(chart);

            const legendHighlight: HighlightNodeDatum = {
                series: chart.series[0],
                itemId: 'apples',
                datum: undefined,
                datumIndex: Number.NaN,
            };

            chart.ctx.highlightManager.updateHighlight(chart.id, legendHighlight);
            await waitForChartStability(chart);

            for (let datumIndex = 0; datumIndex < 4; datumIndex += 1) {
                expect(stateAt(chart, 1, datumIndex)).toBe('unhighlighted-series');
            }
        });

        it('is provably the non-default: highlight.mode left unset behaves like single mode', async () => {
            const options = twoBarSeriesOptions();
            chart = await createChart(options);
            await waitForChartStability(chart);

            const hoveredDatum = defaultHighlightDatum(chart, {
                name: 'q2-apples',
                options,
                seriesIndex: 0,
                datumIndex: 1,
            });
            expect(hoveredDatum).toBeDefined();

            chart.ctx.highlightManager.updateHighlight(chart.id, hoveredDatum);
            await waitForChartStability(chart);

            // Without an explicit `mode`, the non-hovered series' item at the same category stays
            // series-dimmed - proving the default is 'single', not 'shared'.
            expect(stateAt(chart, 1, 1)).toBe('unhighlighted-series');
        });

        it('repaints the previously-matched item when the hover moves to a different category (no itemStyler)', async () => {
            const options = twoBarSeriesOptions('shared');
            chart = await createChart(options);
            await waitForChartStability(chart);

            const datumQ2 = defaultHighlightDatum(chart, { name: 'q2', options, seriesIndex: 0, datumIndex: 1 });
            const datumQ3 = defaultHighlightDatum(chart, { name: 'q3', options, seriesIndex: 0, datumIndex: 2 });
            expect(datumQ2).toBeDefined();
            expect(datumQ3).toBeDefined();

            chart.ctx.highlightManager.updateHighlight(chart.id, datumQ2);
            await waitForChartStability(chart);

            const afterQ2 = baseLayerFillOpacities(chart, 1);
            expect(afterQ2[1]).toBeGreaterThan(afterQ2[0]);
            expect(afterQ2[0]).toBe(afterQ2[2]);
            expect(afterQ2[2]).toBe(afterQ2[3]);

            chart.ctx.highlightManager.updateHighlight(chart.id, datumQ3);
            await waitForChartStability(chart);

            const afterQ3 = baseLayerFillOpacities(chart, 1);
            // Without invalidating the repaint on a shared-match change, the Q2 item stays lit.
            expect(afterQ3[2]).toBeGreaterThan(afterQ3[0]);
            expect(afterQ3[1]).toBe(afterQ3[0]);
            expect(afterQ3[3]).toBe(afterQ3[0]);
        });

        it('resolves the same states for highlight.range node and tooltip', async () => {
            // The range only decides the pick intent, so it must not change the resolved states.
            const statesForRange = async (range: 'node' | 'tooltip') => {
                const options = twoBarSeriesOptions('shared');
                options.highlight = { mode: 'shared', range };
                chart = await createChart(options);
                await waitForChartStability(chart);

                // Inside the Q2 bar of the first series.
                await hoverAction(285, 300)(chart);
                await waitForChartStability(chart);

                const activeHighlight = chart.ctx.highlightManager.getActiveHighlight();
                expect(activeHighlight?.series).toBe(chart.series[0]);
                expect(activeHighlight?.datumIndex).toBe(1);

                const states = [0, 1].map((seriesIndex) =>
                    [0, 1, 2, 3].map((datumIndex) => stateAt(chart, seriesIndex, datumIndex))
                );

                chart.destroy();
                (chart as unknown) = undefined;

                return states;
            };

            const nodeStates = await statesForRange('node');
            expect(nodeStates[1]).toEqual([
                'unhighlighted-series',
                'highlighted-item',
                'unhighlighted-series',
                'unhighlighted-series',
            ]);
            expect(await statesForRange('tooltip')).toEqual(nodeStates);
        });

        it('repaints a third series when the hover moves to a different series and category', async () => {
            const options = prepareTestOptions<AgCartesianChartOptions>({
                data: categoryData.map((d, index) => ({ ...d, pears: 2 + index })),
                axes: {
                    x: { position: 'bottom', type: 'category' },
                    y: { position: 'left', type: 'number' },
                },
                legend: { enabled: false },
                highlight: { mode: 'shared' },
                series: [
                    { type: 'bar', xKey: 'category', yKey: 'apples' },
                    { type: 'bar', xKey: 'category', yKey: 'oranges' },
                    { type: 'bar', xKey: 'category', yKey: 'pears' },
                ],
            });

            chart = await createChart(options);
            await waitForChartStability(chart);

            const datumQ2 = defaultHighlightDatum(chart, { name: 'q2', options, seriesIndex: 0, datumIndex: 1 });
            const datumQ3 = defaultHighlightDatum(chart, { name: 'q3', options, seriesIndex: 1, datumIndex: 2 });
            expect(datumQ2).toBeDefined();
            expect(datumQ3).toBeDefined();

            chart.ctx.highlightManager.updateHighlight(chart.id, datumQ2);
            await waitForChartStability(chart);

            const afterQ2 = baseLayerFillOpacities(chart, 2);
            expect(afterQ2[1]).toBeGreaterThan(afterQ2[0]);

            // Shared mode widens the update beyond the hovered series, so the third series repaints too.
            chart.ctx.highlightManager.updateHighlight(chart.id, datumQ3);
            await waitForChartStability(chart);

            const afterQ3 = baseLayerFillOpacities(chart, 2);
            expect(afterQ3[2]).toBeGreaterThan(afterQ3[0]);
            expect(afterQ3[1]).toBe(afterQ3[0]);
        });

        describe('visual regression', () => {
            it('renders the items at the hovered category lit across every contributing series', async () => {
                const options = twoBarSeriesOptions('shared');
                chart = await createChart(options);
                await waitForChartStability(chart);

                const datumQ2 = defaultHighlightDatum(chart, { name: 'q2', options, seriesIndex: 0, datumIndex: 1 });
                const datumQ3 = defaultHighlightDatum(chart, { name: 'q3', options, seriesIndex: 0, datumIndex: 2 });
                expect(datumQ2).toBeDefined();
                expect(datumQ3).toBeDefined();

                chart.ctx.highlightManager.updateHighlight(chart.id, datumQ2);
                await waitForChartStability(chart);
                await compare();

                // The lit pair must move with the hover, leaving nothing lit at the previous category.
                chart.ctx.highlightManager.updateHighlight(chart.id, datumQ3);
                await waitForChartStability(chart);
                await compare();
            });

            // The maintainer's repro shape, with its explicit highlight styles so each segment's resolved
            // state is legible in the snapshot rather than a difference in opacity. Also the only case
            // where a lit and a dimmed segment sit directly adjacent within one stack.
            it('renders the whole shared group lit across three stacked series', async () => {
                const options = prepareTestOptions<AgCartesianChartOptions>({
                    data: stackedReproData,
                    axes: {
                        x: { position: 'bottom', type: 'category' },
                        y: { position: 'left', type: 'number' },
                    },
                    legend: { enabled: false },
                    highlight: { mode: 'shared' },
                    series: ['apples', 'oranges', 'pears'].map((yKey) => ({
                        type: 'bar',
                        xKey: 'quarter',
                        yKey,
                        stacked: true,
                        highlight: {
                            highlightedItem: { fill: 'gold', stroke: 'gold', strokeWidth: 5 },
                            unhighlightedItem: { stroke: 'red', strokeWidth: 5 },
                            unhighlightedSeries: { stroke: 'grey', strokeWidth: 5 },
                        },
                    })) as AgCartesianChartOptions['series'],
                });

                chart = await createChart(options);
                await waitForChartStability(chart);

                const hoveredDatum = defaultHighlightDatum(chart, {
                    name: 'q2-pears',
                    options,
                    seriesIndex: 2,
                    datumIndex: 1,
                });
                expect(hoveredDatum).toBeDefined();

                chart.ctx.highlightManager.updateHighlight(chart.id, hoveredDatum);
                await waitForChartStability(chart);
                await compare();
            });

            it('renders a series contributing no item at the hovered category dimmed as a whole', async () => {
                const options = prepareTestOptions<AgCartesianChartOptions>({
                    data: categoryData,
                    axes: {
                        x: { position: 'bottom', type: 'category' },
                        y: { position: 'left', type: 'number' },
                    },
                    legend: { enabled: false },
                    highlight: { mode: 'shared' },
                    series: [
                        { type: 'bar', xKey: 'category', yKey: 'apples' },
                        {
                            type: 'bar',
                            xKey: 'category',
                            yKey: 'oranges',
                            data: categoryData.filter((d) => d.category !== 'Q2'),
                        },
                    ],
                });

                chart = await createChart(options);
                await waitForChartStability(chart);

                const hoveredDatum = defaultHighlightDatum(chart, {
                    name: 'q2-apples',
                    options,
                    seriesIndex: 0,
                    datumIndex: 1,
                });
                expect(hoveredDatum).toBeDefined();

                chart.ctx.highlightManager.updateHighlight(chart.id, hoveredDatum);
                await waitForChartStability(chart);
                await compare();
            });

            it('renders single mode unchanged for the same hover', async () => {
                const options = twoBarSeriesOptions('single');
                chart = await createChart(options);
                await waitForChartStability(chart);

                const hoveredDatum = defaultHighlightDatum(chart, {
                    name: 'q2-apples',
                    options,
                    seriesIndex: 0,
                    datumIndex: 1,
                });
                expect(hoveredDatum).toBeDefined();

                chart.ctx.highlightManager.updateHighlight(chart.id, hoveredDatum);
                await waitForChartStability(chart);
                await compare();
            });
        });
    });

    describe('Delayed unhighlight', () => {
        afterEach(() => {
            vi.useRealTimers();
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
            vi.useFakeTimers();

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
            vi.useFakeTimers();

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
            vi.advanceTimersByTime(50);
            expect(highlightManager.getActiveHighlight()).toBeDefined();

            // Advance timer by another 60ms (total 110ms) - now unhighlighted
            vi.advanceTimersByTime(60);
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
            vi.useFakeTimers();

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
            vi.advanceTimersByTime(30);

            // Re-highlight before unhighlight completes - should cancel pending unhighlight
            highlightManager.updateHighlight(callerId, datum);
            const secondHighlight = highlightManager.getActiveHighlight();

            // Should immediately switch to highlighted state
            expect(secondHighlight).toBeDefined();
            expect(secondHighlight).toBe(datum);

            // Advance timer by remaining 70ms (total 100ms) - should still be highlighted
            vi.advanceTimersByTime(70);
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
            vi.useFakeTimers();

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
            vi.advanceTimersByTime(100);
            // B should still be active (only A's entry was cleared)
            expect(highlightManager.getActiveHighlight()).toBe(datumB);

            // Now caller B unhighlights with delayed=true (schedules delayed unhighlight for B)
            highlightManager.updateHighlight(callerB, undefined, true);
            // Should still show B (delay pending)
            expect(highlightManager.getActiveHighlight()).toBe(datumB);

            // Advance timer by 100ms - B's unhighlight fires
            vi.advanceTimersByTime(100);
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
            vi.useFakeTimers();

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
            vi.advanceTimersByTime(30);

            // Caller B highlights (should NOT cancel A's pending unhighlight)
            highlightManager.updateHighlight(callerB, datumB);
            expect(highlightManager.getActiveHighlight()).toBe(datumB);

            // Advance timer by 70ms (total 100ms) - A's unhighlight should fire
            vi.advanceTimersByTime(70);
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
            vi.useFakeTimers();

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
            vi.useFakeTimers();

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
            vi.advanceTimersByTime(50);
            expect(highlightManager.getActiveHighlight()).toBeDefined();

            // Trigger immediate unhighlight before delay completes
            highlightManager.updateHighlight(callerId, undefined, false);

            // Should be immediately unhighlighted
            expect(highlightManager.getActiveHighlight()).toBeUndefined();

            // Wait for original delay period
            vi.advanceTimersByTime(100);

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
            vi.useFakeTimers();

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
            vi.advanceTimersByTime(50);
            expect(highlightManager.getActiveHighlight()).toBeDefined();

            // Second delayed unhighlight call - should NOT reset countdown
            highlightManager.updateHighlight(callerId, undefined, true);

            // Wait another 30ms (total 80ms from first call, 30ms from second call)
            vi.advanceTimersByTime(30);

            // Third delayed unhighlight call - should still NOT reset countdown
            highlightManager.updateHighlight(callerId, undefined, true);

            // Wait another 25ms (total 105ms from first call, 55ms from second, 25ms from third)
            vi.advanceTimersByTime(25);

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
            vi.useFakeTimers();

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
            vi.advanceTimersByTime(50);
            highlightManager.updateHighlight(callerId, datum); // Re-hover before delay completes
            expect(highlightManager.getActiveHighlight()).toBeDefined();

            highlightManager.updateHighlight(callerId, undefined, true); // Unhover again with delayed=true
            vi.advanceTimersByTime(50);
            highlightManager.updateHighlight(callerId, datum); // Re-hover again
            expect(highlightManager.getActiveHighlight()).toBeDefined();

            // Final unhover with delayed=true and advance timer
            highlightManager.updateHighlight(callerId, undefined, true);
            vi.advanceTimersByTime(150);
            expect(highlightManager.getActiveHighlight()).toBeUndefined();
        });
    });
});
