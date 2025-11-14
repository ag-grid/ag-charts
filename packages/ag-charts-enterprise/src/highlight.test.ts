import { afterEach, describe, expect, it } from '@jest/globals';

import type {
    AgCartesianChartOptions,
    AgChartOptions,
    AgPolarChartOptions,
    AgStandaloneChartOptions,
} from 'ag-charts-community';
import { _ModuleSupport } from 'ag-charts-community';
import {
    type Chart,
    IMAGE_SNAPSHOT_DEFAULTS,
    extractImageData,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { ukData } from './series/map-test/ukData';
import { ukRoadData } from './series/map-test/ukRoadData';
import ukRoadTopology from './series/map-test/ukRoadTopology.json';
import ukTopology from './series/map-test/ukTopology.json';
import { createEnterpriseChart } from './test/utils';

describe('Enterprise highlight defaults', () => {
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

    type HighlightNodeDatum = _ModuleSupport.HighlightNodeDatum<_ModuleSupport.DatumIndexType>;
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
        const series = chartInstance.series[seriesIndex] as {
            contextNodeData?: unknown;
            _contextNodeData?: unknown;
        };
        const context =
            series?.contextNodeData ?? (series as any)?.['contextNodeData'] ?? (series as any)._contextNodeData;

        if (!context) return (series as any).getNodeData?.()?.[datumIndex] ?? (series as any).getNodeData?.()?.[0];

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

    const runHighlightSnapshot = async (testCase: HighlightTestCase) => {
        chart = await createEnterpriseChart(testCase.options);
        const highlightDatum = testCase.getDatum?.(chart) ?? defaultHighlightDatum(chart, testCase);
        if (highlightDatum == null) {
            throw new Error(`No highlight datum found for test case: ${testCase.name}`);
        }
        chart.ctx.highlightManager.updateHighlight(chart.id, highlightDatum);
        await compare();
    };

    const boxPlotData = [
        {
            category: 'Group 1',
            minA: 2.4,
            q1A: 3.2,
            medianA: 3.8,
            q3A: 4.5,
            maxA: 5.1,
            minB: 1.9,
            q1B: 2.7,
            medianB: 3.4,
            q3B: 4,
            maxB: 4.7,
        },
        {
            category: 'Group 2',
            minA: 2.1,
            q1A: 2.9,
            medianA: 3.7,
            q3A: 4.1,
            maxA: 4.8,
            minB: 1.6,
            q1B: 2.4,
            medianB: 3.1,
            q3B: 3.6,
            maxB: 4.2,
        },
        {
            category: 'Group 3',
            minA: 2.8,
            q1A: 3.5,
            medianA: 4,
            q3A: 4.7,
            maxA: 5.3,
            minB: 2,
            q1B: 2.8,
            medianB: 3.5,
            q3B: 4.3,
            maxB: 4.9,
        },
    ];

    const financialData = [
        {
            date: new Date(2024, 0, 1),
            openA: 100,
            highA: 108,
            lowA: 96,
            closeA: 104,
            openB: 92,
            highB: 100,
            lowB: 88,
            closeB: 95,
        },
        {
            date: new Date(2024, 0, 2),
            openA: 104,
            highA: 110,
            lowA: 98,
            closeA: 101,
            openB: 95,
            highB: 102,
            lowB: 90,
            closeB: 99,
        },
        {
            date: new Date(2024, 0, 3),
            openA: 101,
            highA: 107,
            lowA: 94,
            closeA: 96,
            openB: 99,
            highB: 106,
            lowB: 92,
            closeB: 104,
        },
        {
            date: new Date(2024, 0, 4),
            openA: 96,
            highA: 103,
            lowA: 91,
            closeA: 99,
            openB: 104,
            highB: 110,
            lowB: 98,
            closeB: 100,
        },
    ];

    const rangeAreaData = [
        { x: 0, lowA: 2, highA: 5, lowB: 1, highB: 4 },
        { x: 1, lowA: 1.5, highA: 4.5, lowB: 0.8, highB: 3.8 },
        { x: 2, lowA: 2.2, highA: 5.1, lowB: 1.4, highB: 4.2 },
        { x: 3, lowA: 1.8, highA: 4.6, lowB: 1.1, highB: 4 },
    ];

    const rangeBarData = [
        { category: 'Q1', lowA: 1, highA: 4, lowB: 0.5, highB: 3.5 },
        { category: 'Q2', lowA: 1.3, highA: 4.2, lowB: 0.8, highB: 3.9 },
        { category: 'Q3', lowA: 1.1, highA: 4.4, lowB: 0.7, highB: 4.1 },
    ];

    const polarCategoryData = [
        { direction: 'N', metricA: 28, metricB: 22 },
        { direction: 'E', metricA: 24, metricB: 19 },
        { direction: 'S', metricA: 32, metricB: 27 },
        { direction: 'W', metricA: 26, metricB: 21 },
    ];

    const heatmapData = [
        { weekday: 'Mon', period: 'Morning', intensity: 2 },
        { weekday: 'Mon', period: 'Afternoon', intensity: 4 },
        { weekday: 'Tue', period: 'Morning', intensity: 5 },
        { weekday: 'Tue', period: 'Afternoon', intensity: 3 },
        { weekday: 'Wed', period: 'Morning', intensity: 6 },
        { weekday: 'Wed', period: 'Afternoon', intensity: 2 },
    ];

    const waterfallData = [
        { stage: 'Revenue', value: 250 },
        { stage: 'COGS', value: -120 },
        { stage: 'Operating', value: -60 },
        { stage: 'Other', value: 25 },
        { stage: 'Net', value: 95 },
    ];

    const sankeyData = [
        { from: 'Marketing', to: 'Leads', value: 120 },
        { from: 'Leads', to: 'Opportunities', value: 80 },
        { from: 'Opportunities', to: 'Closed', value: 45 },
        { from: 'Marketing', to: 'Awareness', value: 60 },
    ];

    const chordData = [
        { from: 'North', to: 'East', value: 12 },
        { from: 'East', to: 'South', value: 10 },
        { from: 'South', to: 'West', value: 14 },
        { from: 'West', to: 'North', value: 9 },
        { from: 'North', to: 'South', value: 7 },
    ];

    const funnelStages = [
        { stage: 'Visitors', value: 1000 },
        { stage: 'Signups', value: 600 },
        { stage: 'Trials', value: 260 },
        { stage: 'Customers', value: 120 },
    ];

    const pyramidStages = [
        { stage: 'Prospects', value: 900 },
        { stage: 'Qualified', value: 520 },
        { stage: 'Proposal', value: 270 },
        { stage: 'Closed', value: 140 },
    ];

    const multiSeriesCases: HighlightTestCase[] = [
        {
            name: 'box-plot',
            options: {
                data: boxPlotData,
                series: [
                    {
                        type: 'box-plot',
                        xKey: 'category',
                        minKey: 'minA',
                        q1Key: 'q1A',
                        medianKey: 'medianA',
                        q3Key: 'q3A',
                        maxKey: 'maxA',
                    },
                    {
                        type: 'scatter',
                        xKey: 'category',
                        yKey: 'minB',
                    },
                ],
            } as AgCartesianChartOptions,
            seriesIndex: 0,
            datumIndex: 2,
        },
        {
            name: 'candlestick',
            options: {
                data: financialData,
                axes: {
                    x: { type: 'time', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                series: [
                    {
                        type: 'candlestick',
                        xKey: 'date',
                        openKey: 'openA',
                        highKey: 'highA',
                        lowKey: 'lowA',
                        closeKey: 'closeA',
                    },
                    {
                        type: 'line',
                        xKey: 'date',
                        yKey: 'openB',
                    },
                ],
            } as AgCartesianChartOptions,
            seriesIndex: 0,
            datumIndex: 1,
            getDatum: (chartInstance) => (chartInstance.series[0] as any).getNodeData?.()?.[1],
        },
        {
            name: 'ohlc',
            options: {
                data: financialData,
                axes: {
                    x: { type: 'time', position: 'bottom' },
                    y: { type: 'number', position: 'left' },
                },
                series: [
                    {
                        type: 'ohlc',
                        xKey: 'date',
                        openKey: 'openA',
                        highKey: 'highA',
                        lowKey: 'lowA',
                        closeKey: 'closeA',
                    },
                    {
                        type: 'line',
                        xKey: 'date',
                        yKey: 'openB',
                    },
                ],
            } as AgCartesianChartOptions,
            seriesIndex: 0,
            datumIndex: 2,
        },
        {
            name: 'nightingale',
            options: {
                data: polarCategoryData,
                legend: { enabled: false },
                series: [
                    {
                        type: 'nightingale',
                        angleKey: 'direction',
                        radiusKey: 'metricA',
                        label: { enabled: true },
                    },
                    {
                        type: 'nightingale',
                        angleKey: 'direction',
                        radiusKey: 'metricB',
                        label: { enabled: true },
                    },
                ],
            } as AgPolarChartOptions,
            seriesIndex: 0,
            datumIndex: 1,
            getDatum: (chartInstance) => (chartInstance.series[0] as any).getNodeData?.()?.[1],
        },
        {
            name: 'radar-area',
            options: {
                data: polarCategoryData,
                legend: { enabled: false },
                axes: { angle: { type: 'angle-category' }, radius: { type: 'radius-number' } },
                series: [
                    {
                        type: 'radar-area',
                        angleKey: 'direction',
                        radiusKey: 'metricA',
                        marker: {
                            size: 20,
                        },
                        label: { enabled: true },
                    },
                    {
                        type: 'radar-area',
                        angleKey: 'direction',
                        radiusKey: 'metricB',
                        marker: {
                            size: 20,
                        },
                        label: { enabled: true },
                    },
                ],
            } as AgPolarChartOptions,
            seriesIndex: 0,
            datumIndex: 2,
            getDatum: (chartInstance) => (chartInstance.series[0] as any).getNodeData?.()?.[2],
        },
        {
            name: 'radar-line',
            options: {
                data: polarCategoryData,
                legend: { enabled: false },
                axes: { angle: { type: 'angle-category' }, radius: { type: 'radius-number' } },
                series: [
                    {
                        type: 'radar-line',
                        angleKey: 'direction',
                        radiusKey: 'metricA',
                        label: { enabled: true },
                        marker: { enabled: true },
                    },
                    {
                        type: 'radar-line',
                        angleKey: 'direction',
                        radiusKey: 'metricB',
                        label: { enabled: true },
                        marker: { enabled: true },
                    },
                ],
            } as AgPolarChartOptions,
            seriesIndex: 0,
            datumIndex: 1,
            getDatum: (chartInstance) => (chartInstance.series[0] as any).getNodeData?.()?.[1],
        },
        {
            name: 'radial-bar',
            options: {
                data: polarCategoryData,
                axes: { angle: { type: 'angle-number' }, radius: { type: 'radius-category' } },
                series: [
                    {
                        type: 'radial-bar',
                        angleKey: 'metricA',
                        radiusKey: 'direction',
                        label: { enabled: true },
                    },
                    {
                        type: 'radial-bar',
                        angleKey: 'metricB',
                        radiusKey: 'direction',
                        label: { enabled: true },
                    },
                ],
            } as AgPolarChartOptions,
            seriesIndex: 0,
            datumIndex: 3,
            getDatum: (chartInstance) => (chartInstance.series[0] as any).getNodeData?.()?.[3],
        },
        {
            name: 'radial-column',
            options: {
                data: polarCategoryData,
                axes: { angle: { type: 'angle-category' }, radius: { type: 'radius-number' } },
                series: [
                    {
                        type: 'radial-column',
                        angleKey: 'direction',
                        radiusKey: 'metricA',
                        label: { enabled: true },
                    },
                    {
                        type: 'radial-column',
                        angleKey: 'direction',
                        radiusKey: 'metricB',
                        label: { enabled: true },
                    },
                ],
            } as AgPolarChartOptions,
            seriesIndex: 0,
            datumIndex: 2,
        },
        {
            name: 'range-area',
            options: {
                data: rangeAreaData,
                axes: {
                    x: { position: 'bottom', type: 'number' },
                    y: { position: 'left', type: 'number' },
                },
                series: [
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'lowA',
                        yHighKey: 'highA',
                        marker: { size: 20 },
                        label: { enabled: true },
                    },
                    {
                        type: 'range-area',
                        xKey: 'x',
                        yLowKey: 'lowB',
                        yHighKey: 'highB',
                        marker: { size: 20 },
                        label: { enabled: true },
                    },
                ],
            } as AgCartesianChartOptions,
            seriesIndex: 0,
            datumIndex: 1,
        },
        {
            name: 'range-bar',
            options: {
                data: rangeBarData,
                series: [
                    {
                        type: 'range-bar',
                        xKey: 'category',
                        yLowKey: 'lowA',
                        yHighKey: 'highA',
                        label: { enabled: true },
                    },
                    {
                        type: 'range-bar',
                        xKey: 'category',
                        yLowKey: 'lowB',
                        yHighKey: 'highB',
                        label: { enabled: true },
                    },
                ],
            } as AgCartesianChartOptions,
            seriesIndex: 0,
            datumIndex: 1,
        },
        {
            name: 'map-shape',
            options: {
                topology: ukTopology,
                legend: { enabled: false },
                series: [
                    { type: 'map-shape-background' },
                    {
                        type: 'map-shape',
                        data: ukData,
                        idKey: 'name',
                        labelKey: 'name',
                        colorKey: 'population',
                        label: { enabled: true },
                    },
                ],
            },
            seriesIndex: 1,
            datumIndex: 0,
            getDatum: (chartInstance) => (chartInstance.series[1] as any).getNodeData?.()?.[0],
        },
        {
            name: 'map-line',
            options: {
                topology: ukRoadTopology,
                legend: { enabled: false },
                series: [
                    {
                        type: 'map-line',
                        data: ukRoadData,
                        idKey: 'name',
                        label: { enabled: true },
                        labelKey: 'name',
                    },
                ],
            },
            seriesIndex: 0,
            datumIndex: 2,
            getDatum: (chartInstance) => (chartInstance.series[0] as any).getNodeData?.()?.[2],
        },
        {
            name: 'map-marker',
            options: {
                topology: ukTopology,
                legend: { enabled: false },
                series: [
                    { type: 'map-shape-background' },
                    {
                        type: 'map-marker',
                        data: ukData,
                        idKey: 'name',
                        sizeKey: 'population',
                        shape: 'square',
                        labelKey: 'name',
                        label: { enabled: true },
                    },
                ],
            },
            seriesIndex: 1,
            datumIndex: 1,
            getDatum: (chartInstance) => (chartInstance.series[1] as any).getNodeData?.()?.[1],
        },
    ];

    const sankeyOptions: AgStandaloneChartOptions = {
        data: sankeyData,
        series: [
            {
                type: 'sankey',
                fromKey: 'from',
                toKey: 'to',
                sizeKey: 'value',
                label: { enabled: true },
                link: { strokeWidth: 1 },
            },
        ],
    };

    const chordOptions: AgStandaloneChartOptions = {
        data: chordData,
        series: [
            {
                type: 'chord',
                fromKey: 'from',
                toKey: 'to',
                sizeKey: 'value',
                label: { enabled: true },
            },
        ],
    };

    const pyramidOptions: AgStandaloneChartOptions = {
        data: pyramidStages,
        series: [
            {
                type: 'pyramid',
                stageKey: 'stage',
                valueKey: 'value',
                label: { enabled: true },
                stageLabel: { enabled: true },
            },
        ],
    };

    const singleSeriesCases: HighlightTestCase[] = [
        {
            name: 'heatmap',
            options: {
                data: heatmapData,
                series: [
                    {
                        type: 'heatmap',
                        xKey: 'weekday',
                        yKey: 'period',
                        colorKey: 'intensity',
                        label: { enabled: true },
                    },
                ],
            } as AgCartesianChartOptions,
            seriesIndex: 0,
            datumIndex: 2,
        },
        {
            name: 'waterfall',
            options: {
                data: waterfallData,
                series: [
                    {
                        type: 'waterfall',
                        xKey: 'stage',
                        yKey: 'value',
                        item: {
                            positive: { label: { enabled: true } },
                            negative: { label: { enabled: true } },
                            total: { label: { enabled: true } },
                        },
                        totals: [{ index: waterfallData.length, axisLabel: 'Net', totalType: 'total' }],
                    },
                ],
            } as AgCartesianChartOptions,
            seriesIndex: 0,
            datumIndex: 3,
        },
        {
            name: 'sankey',
            options: sankeyOptions,
            getDatum: (chartInstance) => {
                const series = chartInstance.series[0] as {
                    contextNodeData?: unknown;
                    _contextNodeData?: unknown;
                };
                const context =
                    series?.contextNodeData ?? (series as any)?.['contextNodeData'] ?? (series as any)._contextNodeData;
                const contexts = Array.isArray(context) ? context : [context];

                for (const entry of contexts) {
                    const nodes = (entry as { nodeData?: HighlightNodeDatum[] } | undefined)?.nodeData;
                    const match = nodes?.find((datum) => (datum as any)?.type != null);
                    if (match) return match;
                    if (nodes && nodes.length > 0) return nodes[0];
                }

                return undefined;
            },
        },
        {
            name: 'chord',
            options: chordOptions,
            getDatum: (chartInstance) => {
                const series = chartInstance.series[0] as {
                    contextNodeData?: unknown;
                    _contextNodeData?: unknown;
                };
                const context =
                    series?.contextNodeData ?? (series as any)?.['contextNodeData'] ?? (series as any)._contextNodeData;
                const contexts = Array.isArray(context) ? context : [context];

                for (const entry of contexts) {
                    const nodes = (entry as { nodeData?: HighlightNodeDatum[] } | undefined)?.nodeData;
                    const match = nodes?.find((datum) => (datum as any)?.datum != null);
                    if (match) return match;
                    if (nodes && nodes.length > 0) return nodes[0];
                }

                return undefined;
            },
        },
        {
            name: 'funnel',
            options: {
                data: funnelStages,
                series: [
                    {
                        type: 'funnel',
                        stageKey: 'stage',
                        valueKey: 'value',
                        label: { enabled: true },
                        stageLabel: { enabled: true },
                    },
                ],
            } as AgCartesianChartOptions,
            seriesIndex: 0,
            datumIndex: 2,
        },
        {
            name: 'cone-funnel',
            options: {
                data: funnelStages,
                series: [
                    {
                        type: 'cone-funnel',
                        stageKey: 'stage',
                        valueKey: 'value',
                        label: { enabled: true },
                        stageLabel: { enabled: true },
                    },
                ],
            } as AgCartesianChartOptions,
            seriesIndex: 0,
            datumIndex: 1,
        },
        {
            name: 'pyramid',
            options: pyramidOptions,
            seriesIndex: 0,
            datumIndex: 1,
        },
    ];

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

    describe('hierarchy series', () => {
        const hierarchyData = [
            {
                name: 'Root A',
                children: [
                    { name: 'A-Tile-1', size: 100, value: 10 },
                    { name: 'A-Tile-2', size: 150, value: 15 },
                    {
                        name: 'A-Group-1',
                        children: [
                            { name: 'A-G1-Tile-1', size: 80, value: 8 },
                            { name: 'A-G1-Tile-2', size: 120, value: 12 },
                        ],
                    },
                ],
            },
            {
                name: 'Root B',
                children: [
                    { name: 'B-Tile-1', size: 200, value: 20 },
                    {
                        name: 'B-Group-1',
                        children: [
                            { name: 'B-G1-Tile-1', size: 90, value: 9 },
                            { name: 'B-G1-Tile-2', size: 110, value: 11 },
                        ],
                    },
                ],
            },
        ];

        const getNodeAtPath = (chartInstance: Chart, path: number[]): HighlightNodeDatum | undefined => {
            const series = chartInstance.series[0] as any;
            let node = series.rootNode;
            if (!node) return undefined;

            for (const index of path) {
                node = node?.children?.[index];
                if (!node) return undefined;
            }

            return node as HighlightNodeDatum;
        };

        describe('treemap', () => {
            it('tile highlight - same root branch', async () => {
                chart = await createEnterpriseChart({
                    data: hierarchyData,
                    series: [
                        {
                            type: 'treemap',
                            labelKey: 'name',
                            sizeKey: 'size',
                        },
                    ],
                });

                // Hover over first tile in Root A (path: [0, 0])
                const highlightDatum = getNodeAtPath(chart, [0, 0]);
                if (!highlightDatum) throw new Error('No highlight datum found');
                chart.ctx.highlightManager.updateHighlight(chart.id, highlightDatum);
                await compare();
            });

            it('tile highlight - different root branch', async () => {
                chart = await createEnterpriseChart({
                    data: hierarchyData,
                    series: [
                        {
                            type: 'treemap',
                            labelKey: 'name',
                            sizeKey: 'size',
                        },
                    ],
                });

                // Hover over first tile in Root B (path: [1, 0])
                const highlightDatum = getNodeAtPath(chart, [1, 0]);
                if (!highlightDatum) throw new Error('No highlight datum found');
                chart.ctx.highlightManager.updateHighlight(chart.id, highlightDatum);
                await compare();
            });

            it('group highlight - tiles inherit only opacity', async () => {
                chart = await createEnterpriseChart({
                    data: hierarchyData,
                    series: [
                        {
                            type: 'treemap',
                            labelKey: 'name',
                            sizeKey: 'size',
                            group: {
                                highlight: {
                                    highlightedItem: {
                                        opacity: 1,
                                        fill: 'red', // Should NOT be inherited by tiles
                                        stroke: 'darkred', // Should NOT be inherited by tiles
                                        strokeWidth: 5, // Should NOT be inherited by tiles
                                    },
                                    unhighlightedItem: {
                                        opacity: 0.3,
                                    },
                                },
                            },
                        },
                    ],
                });

                // Hover over group in Root A (path: [0, 2])
                const highlightDatum = getNodeAtPath(chart, [0, 2]);
                if (!highlightDatum) throw new Error('No highlight datum found');
                chart.ctx.highlightManager.updateHighlight(chart.id, highlightDatum);
                await compare();
            });

            it('group highlight - different root branches', async () => {
                chart = await createEnterpriseChart({
                    data: hierarchyData,
                    series: [
                        {
                            type: 'treemap',
                            labelKey: 'name',
                            sizeKey: 'size',
                            group: {
                                highlight: {
                                    highlightedItem: { opacity: 1 },
                                    unhighlightedItem: { opacity: 0.1 },
                                },
                            },
                        },
                    ],
                });

                // Hover over group in Root B (path: [1, 1])
                const highlightDatum = getNodeAtPath(chart, [1, 1]);
                if (!highlightDatum) throw new Error('No highlight datum found');
                chart.ctx.highlightManager.updateHighlight(chart.id, highlightDatum);
                await compare();
            });

            it('custom tile highlight - highlightedItem', async () => {
                chart = await createEnterpriseChart({
                    data: hierarchyData,
                    series: [
                        {
                            type: 'treemap',
                            labelKey: 'name',
                            sizeKey: 'size',
                            tile: {
                                highlight: {
                                    highlightedItem: {
                                        fill: 'orange',
                                        fillOpacity: 0.9,
                                        stroke: 'darkorange',
                                    },
                                    unhighlightedItem: {
                                        fill: 'grey',
                                    },
                                    unhighlightedBranch: {
                                        fill: 'orange',
                                    },
                                    highlightedBranch: {
                                        strokeWidth: 5,
                                    },
                                },
                            },
                        },
                    ],
                });

                const highlightDatum = getNodeAtPath(chart, [0, 0]);
                if (!highlightDatum) throw new Error('No highlight datum found');
                chart.ctx.highlightManager.updateHighlight(chart.id, highlightDatum);
                await compare();
            });

            it('custom tile highlight - unhighlightedBranch', async () => {
                chart = await createEnterpriseChart({
                    data: hierarchyData,
                    series: [
                        {
                            type: 'treemap',
                            labelKey: 'name',
                            sizeKey: 'size',
                            tile: {
                                highlight: {
                                    unhighlightedBranch: {
                                        fill: 'gray',
                                        fillOpacity: 0.3,
                                        strokeOpacity: 0.5,
                                    },
                                },
                            },
                        },
                    ],
                });

                // Hover tile in Root A to see Root B dimmed
                const highlightDatum = getNodeAtPath(chart, [0, 0]);
                if (!highlightDatum) throw new Error('No highlight datum found');
                chart.ctx.highlightManager.updateHighlight(chart.id, highlightDatum);
                await compare();
            });

            it('colorScale without highlight fill - uses colorScale', async () => {
                chart = await createEnterpriseChart({
                    data: hierarchyData,
                    series: [
                        {
                            type: 'treemap',
                            labelKey: 'name',
                            sizeKey: 'size',
                            colorKey: 'value',
                            colorRange: ['#2196F3', '#FFC107'],
                            // No highlight.fill configured - should use colorScale
                        },
                    ],
                });

                const highlightDatum = getNodeAtPath(chart, [0, 0]);
                if (!highlightDatum) throw new Error('No highlight datum found');
                chart.ctx.highlightManager.updateHighlight(chart.id, highlightDatum);
                await compare();
            });

            it('colorScale with highlight fill - highlight overrides colorScale', async () => {
                chart = await createEnterpriseChart({
                    data: hierarchyData,
                    series: [
                        {
                            type: 'treemap',
                            labelKey: 'name',
                            sizeKey: 'size',
                            colorKey: 'value',
                            colorRange: ['#2196F3', '#FFC107'],
                            tile: {
                                highlight: {
                                    highlightedItem: {
                                        fill: 'red', // Should override colorScale
                                    },
                                },
                            },
                        },
                    ],
                });

                const highlightDatum = getNodeAtPath(chart, [0, 0]);
                if (!highlightDatum) throw new Error('No highlight datum found');
                chart.ctx.highlightManager.updateHighlight(chart.id, highlightDatum);
                await compare();
            });

            it('nested group highlight - opacity inheritance', async () => {
                chart = await createEnterpriseChart({
                    data: hierarchyData,
                    series: [
                        {
                            type: 'treemap',
                            labelKey: 'name',
                            sizeKey: 'size',
                            group: {
                                highlight: {
                                    highlightedItem: { opacity: 0.5 },
                                    unhighlightedItem: { opacity: 1 },
                                },
                            },
                        },
                    ],
                });

                // Hover over nested group (path: [0, 2])
                const highlightDatum = getNodeAtPath(chart, [0, 2]);
                if (!highlightDatum) throw new Error('No highlight datum found');
                chart.ctx.highlightManager.updateHighlight(chart.id, highlightDatum);
                await compare();
            });
        });

        describe('sunburst', () => {
            it('segment highlight - same root branch', async () => {
                chart = await createEnterpriseChart({
                    data: hierarchyData,
                    series: [
                        {
                            type: 'sunburst',
                            labelKey: 'name',
                            sizeKey: 'size',
                        },
                    ],
                });

                // Hover over first segment in Root A (path: [0, 0])
                const highlightDatum = getNodeAtPath(chart, [0, 0]);
                if (!highlightDatum) throw new Error('No highlight datum found');
                chart.ctx.highlightManager.updateHighlight(chart.id, highlightDatum);
                await compare();
            });

            it('segment highlight - different root branch', async () => {
                chart = await createEnterpriseChart({
                    data: hierarchyData,
                    series: [
                        {
                            type: 'sunburst',
                            labelKey: 'name',
                            sizeKey: 'size',
                        },
                    ],
                });

                // Hover over first segment in Root B (path: [1, 0])
                const highlightDatum = getNodeAtPath(chart, [1, 0]);
                if (!highlightDatum) throw new Error('No highlight datum found');
                chart.ctx.highlightManager.updateHighlight(chart.id, highlightDatum);
                await compare();
            });

            it('custom highlight - highlightedItem', async () => {
                chart = await createEnterpriseChart({
                    data: hierarchyData,
                    series: [
                        {
                            type: 'sunburst',
                            labelKey: 'name',
                            sizeKey: 'size',
                            highlight: {
                                highlightedItem: {
                                    fill: 'purple',
                                    fillOpacity: 0.9,
                                    stroke: 'darkviolet',
                                    strokeWidth: 3,
                                },
                            },
                        },
                    ],
                });

                const highlightDatum = getNodeAtPath(chart, [0, 0]);
                if (!highlightDatum) throw new Error('No highlight datum found');
                chart.ctx.highlightManager.updateHighlight(chart.id, highlightDatum);
                await compare();
            });

            it('custom highlight - unhighlightedBranch', async () => {
                chart = await createEnterpriseChart({
                    data: hierarchyData,
                    series: [
                        {
                            type: 'sunburst',
                            labelKey: 'name',
                            sizeKey: 'size',
                            highlight: {
                                unhighlightedBranch: {
                                    fillOpacity: 0.2,
                                    strokeOpacity: 0.4,
                                },
                            },
                        },
                    ],
                });

                // Hover segment in Root A to see Root B dimmed
                const highlightDatum = getNodeAtPath(chart, [0, 0]);
                if (!highlightDatum) throw new Error('No highlight datum found');
                chart.ctx.highlightManager.updateHighlight(chart.id, highlightDatum);
                await compare();
            });

            it('colorScale without highlight fill - uses colorScale', async () => {
                chart = await createEnterpriseChart({
                    data: hierarchyData,
                    series: [
                        {
                            type: 'sunburst',
                            labelKey: 'name',
                            sizeKey: 'size',
                            colorKey: 'value',
                            colorRange: ['#E91E63', '#9C27B0'],
                            // No highlight.fill configured - should use colorScale
                        },
                    ],
                });

                const highlightDatum = getNodeAtPath(chart, [0, 0]);
                if (!highlightDatum) throw new Error('No highlight datum found');
                chart.ctx.highlightManager.updateHighlight(chart.id, highlightDatum);
                await compare();
            });

            it('colorScale with highlight fill - highlight overrides colorScale', async () => {
                chart = await createEnterpriseChart({
                    data: hierarchyData,
                    series: [
                        {
                            type: 'sunburst',
                            labelKey: 'name',
                            sizeKey: 'size',
                            colorKey: 'value',
                            colorRange: ['#E91E63', '#9C27B0'],
                            highlight: {
                                highlightedItem: {
                                    fill: 'green', // Should override colorScale
                                },
                            },
                        },
                    ],
                });

                const highlightDatum = getNodeAtPath(chart, [0, 0]);
                if (!highlightDatum) throw new Error('No highlight datum found');
                chart.ctx.highlightManager.updateHighlight(chart.id, highlightDatum);
                await compare();
            });

            it('inner ring highlight - branch highlighting', async () => {
                chart = await createEnterpriseChart({
                    data: hierarchyData,
                    series: [
                        {
                            type: 'sunburst',
                            labelKey: 'name',
                            sizeKey: 'size',
                        },
                    ],
                });

                // Hover over inner ring (parent node) - path: [0]
                const highlightDatum = getNodeAtPath(chart, [0]);
                if (!highlightDatum) throw new Error('No highlight datum found');
                chart.ctx.highlightManager.updateHighlight(chart.id, highlightDatum);
                await compare();
            });
        });
    });
});
