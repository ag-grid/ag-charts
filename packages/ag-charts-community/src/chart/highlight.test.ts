import { afterEach, describe, expect, it } from '@jest/globals';

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
                animation: { enabled: false },
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
                animation: { enabled: false },
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
                animation: { enabled: false },
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
                animation: { enabled: false },
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
                animation: { enabled: false },
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
                animation: { enabled: false },
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
                animation: { enabled: false },
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
                animation: { enabled: false },
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
});
