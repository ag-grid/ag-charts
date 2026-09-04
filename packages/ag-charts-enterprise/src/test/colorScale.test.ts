import { afterEach, describe, expect, it } from 'vitest';

import {
    type AgBubbleSeriesOptions,
    type AgChartOptions,
    AgCharts,
    type AgScatterSeriesOptions,
} from 'ag-charts-community';
import {
    assertTooltipPresentForAll,
    deproxy,
    hoverAction,
    setupMockCanvas,
    setupMockConsole,
    waitForChartStability,
} from 'ag-charts-community-test';

import { ukData } from '../series/map-test/ukData';
import ukTopology from '../series/map-test/ukTopology.json';
import { prepareEnterpriseTestOptions } from './utils';

interface ColorScaleSeriesLike {
    getTooltipContent(datumIndex: number): unknown;
}

const fills = [{ color: 'blue' }, { color: 'yellow' }, { color: 'red' }];

const data: Array<{ x: number; y: number; size: number; intensity?: number | null }> = [
    { x: 1, y: 1, size: 5, intensity: 10 },
    { x: 2, y: 2, size: 5, intensity: null },
    { x: 3, y: 3, size: 5 },
    { x: 4, y: 4, size: 5, intensity: 20 },
];

const seriesBaseByType = {
    bubble: { type: 'bubble' as const, xKey: 'x', yKey: 'y', sizeKey: 'size', colorKey: 'intensity' },
    scatter: { type: 'scatter' as const, xKey: 'x', yKey: 'y', colorKey: 'intensity' },
};

interface PresenceCase {
    name: string;
    seriesType: 'bubble' | 'scatter';
    missingDataFill: string | undefined;
}

// Tier-2 colour-scale series keep the tooltip on missing-colour datums; `missingDataFill` is a cosmetic override only.
const cases: PresenceCase[] = [
    { name: 'BubbleSeries with missingDataFill', seriesType: 'bubble', missingDataFill: '#cccccc' },
    { name: 'ScatterSeries with missingDataFill', seriesType: 'scatter', missingDataFill: '#cccccc' },
    { name: 'BubbleSeries without missingDataFill', seriesType: 'bubble', missingDataFill: undefined },
    { name: 'ScatterSeries without missingDataFill', seriesType: 'scatter', missingDataFill: undefined },
];

// `colorKey` is enterprise-gated on these community series options, so tests must run under
// `prepareEnterpriseTestOptions` or the option is cleared and the code path is never hit.
describe('colorScale.missingDataFill - bubble/scatter', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: any;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            chart = undefined;
        }
    });

    it.each(cases)('$name', async ({ seriesType, missingDataFill }) => {
        const series: AgBubbleSeriesOptions | AgScatterSeriesOptions = {
            ...seriesBaseByType[seriesType],
            colorScale: { fills, ...(missingDataFill != null && { missingDataFill }) },
        };
        const options: AgChartOptions = prepareEnterpriseTestOptions({ data, series: [series] });

        chart = deproxy(AgCharts.create(options));
        await waitForChartStability(chart);

        const seriesImpl = chart.series[0] as ColorScaleSeriesLike;
        assertTooltipPresentForAll(
            seriesImpl,
            data,
            (d) => d.intensity == null,
            (i) => i
        );
    });

    let capturedFill: unknown;

    const swatchFillCases: Array<
        | { seriesType: 'bubble'; build: (missingDataFill: string) => AgBubbleSeriesOptions }
        | { seriesType: 'scatter'; build: (missingDataFill: string) => AgScatterSeriesOptions }
    > = [
        {
            seriesType: 'bubble',
            build: (missingDataFill) => ({
                ...seriesBaseByType.bubble,
                colorScale: { fills, missingDataFill },
                tooltip: {
                    renderer: (params) => {
                        capturedFill = params.fill;
                        return '';
                    },
                },
            }),
        },
        {
            seriesType: 'scatter',
            build: (missingDataFill) => ({
                ...seriesBaseByType.scatter,
                colorScale: { fills, missingDataFill },
                tooltip: {
                    renderer: (params) => {
                        capturedFill = params.fill;
                        return '';
                    },
                },
            }),
        },
    ];

    it.each(swatchFillCases)(
        '$seriesType tooltip swatch uses missingDataFill for missing-colour datum',
        async ({ build }) => {
            const missingDataFill = 'tomato';
            const options: AgChartOptions = prepareEnterpriseTestOptions({
                data,
                series: [build(missingDataFill)],
            });

            chart = deproxy(AgCharts.create(options));
            await waitForChartStability(chart);

            const markerAt = (predicate: (d: (typeof data)[number]) => boolean) => {
                const datumIndex = data.findIndex(predicate);
                const node = chart.series[0].contextNodeData?.nodeData?.[datumIndex];
                if (node?.midPoint == null) throw new Error(`No rendered marker at index ${datumIndex}`);
                return node.midPoint as { x: number; y: number };
            };

            const missingMarker = markerAt((d) => d.intensity == null);
            await hoverAction(missingMarker.x, missingMarker.y)(chart);
            await waitForChartStability(chart);
            expect(capturedFill).toBe(missingDataFill);
        }
    );
});

// A user-supplied partial `colorScale` must not wipe theme-supplied fills derived via `$map` theme expressions.
describe('colorScale partial options — theme fills survive user partials', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: any;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            chart = undefined;
        }
    });

    function assertColorScalePopulated() {
        const series: any = deproxy(chart).series.find((s: any) => s.colorScale != null);
        expect(series).toBeDefined();
        expect(series.colorScale.domain.length).toBeGreaterThanOrEqual(2);
        expect(series.colorScale.range.length).toBeGreaterThanOrEqual(2);
        expect(series.colorScale.range).not.toEqual(['red', 'blue']);
    }

    it('heatmap with colorScale: {}', async () => {
        const options: AgChartOptions = prepareEnterpriseTestOptions({
            data: [
                { x: 'A', y: '1', v: 10 },
                { x: 'B', y: '1', v: 20 },
                { x: 'A', y: '2', v: 30 },
                { x: 'B', y: '2', v: 40 },
            ],
            series: [{ type: 'heatmap', xKey: 'x', yKey: 'y', colorKey: 'v', colorScale: {} }],
        });

        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        assertColorScalePopulated();
    });

    it('treemap with colorScale: {}', async () => {
        const options: AgChartOptions = prepareEnterpriseTestOptions({
            data: [
                { title: 'A', size: 10, color: 1, children: [{ title: 'A1', size: 5, color: 2 }] },
                { title: 'B', size: 20, color: 3, children: [{ title: 'B1', size: 8, color: 4 }] },
            ],
            series: [
                {
                    type: 'treemap',
                    labelKey: 'title',
                    sizeKey: 'size',
                    colorKey: 'color',
                    childrenKey: 'children',
                    colorScale: {},
                },
            ],
        });

        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        assertColorScalePopulated();
    });

    it('sunburst with colorScale: {}', async () => {
        const options: AgChartOptions = prepareEnterpriseTestOptions({
            data: [
                { name: 'A', size: 10, color: 1, children: [{ name: 'A1', size: 5, color: 2 }] },
                { name: 'B', size: 20, color: 3, children: [{ name: 'B1', size: 8, color: 4 }] },
            ],
            series: [
                {
                    type: 'sunburst',
                    labelKey: 'name',
                    sizeKey: 'size',
                    colorKey: 'color',
                    childrenKey: 'children',
                    colorScale: {},
                },
            ],
        });

        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        assertColorScalePopulated();
    });

    it('map-marker with colorScale: {}', async () => {
        const options: AgChartOptions = prepareEnterpriseTestOptions({
            data: ukData,
            topology: ukTopology,
            series: [
                { type: 'map-shape-background' },
                { type: 'map-marker', idKey: 'name', colorKey: 'population', colorScale: {} },
            ],
        });

        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        assertColorScalePopulated();
    });

    it('map-shape with colorScale: {}', async () => {
        const options: AgChartOptions = prepareEnterpriseTestOptions({
            data: ukData,
            topology: ukTopology,
            series: [{ type: 'map-shape', idKey: 'name', colorKey: 'population', colorScale: {} }],
        });

        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        assertColorScalePopulated();
    });

    it('heatmap with colorScale: { mode: "discrete" }', async () => {
        const options: AgChartOptions = prepareEnterpriseTestOptions({
            data: [
                { x: 'A', y: '1', v: 10 },
                { x: 'B', y: '1', v: 20 },
                { x: 'A', y: '2', v: 30 },
                { x: 'B', y: '2', v: 40 },
            ],
            series: [{ type: 'heatmap', xKey: 'x', yKey: 'y', colorKey: 'v', colorScale: { mode: 'discrete' } }],
        });

        chart = AgCharts.create(options);
        await waitForChartStability(chart);
        assertColorScalePopulated();
    });
});

// `colorKey` is enterprise-gated, so an empty-string `colorKey` can only be exercised here.
describe('AG-18413 empty-string colorKey - bubble/scatter', () => {
    setupMockConsole();
    setupMockCanvas();

    let chart: any;

    afterEach(() => {
        if (chart) {
            chart.destroy();
            chart = undefined;
        }
    });

    const colorValues = (c: any) =>
        (c.series[0] as unknown as { getNodeData(): Array<{ colorValue?: number }> })
            .getNodeData()
            .map((d) => d.colorValue);

    const createChartWith = async (series: AgBubbleSeriesOptions | AgScatterSeriesOptions) => {
        const options: AgChartOptions = prepareEnterpriseTestOptions({ data, series: [series] });
        chart = deproxy(AgCharts.create(options));
        await waitForChartStability(chart);
        return colorValues(chart);
    };

    it.each([
        ['bubble', { type: 'bubble' as const, xKey: 'x', yKey: 'y', sizeKey: 'size' }],
        ['scatter', { type: 'scatter' as const, xKey: 'x', yKey: 'y' }],
    ])('%s falls back to the default fill when colorKey is an empty string (TC2)', async (_name, base) => {
        const emptyKey = await createChartWith({ ...base, colorKey: '', colorScale: { fills } });

        chart.destroy();
        chart = undefined;
        const omitted = await createChartWith({ ...base, colorScale: { fills } });

        chart.destroy();
        chart = undefined;
        const populated = await createChartWith({ ...base, colorKey: 'intensity', colorScale: { fills } });

        expect(emptyKey).toHaveLength(data.length);
        expect(emptyKey.every((value) => value === undefined)).toBe(true);
        expect(emptyKey).toEqual(omitted);
        expect(populated.some((value) => value != null)).toBe(true);
    });
});
