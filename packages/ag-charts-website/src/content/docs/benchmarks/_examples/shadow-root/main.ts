// @ag-skip-fws
/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts, AgDropShadowOptions, AgGlowOptions, VERSION } from 'ag-charts-enterprise';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { ChartRef, performDatumHighlight, performInitialLoad } from './benchmarkUtils';
import { getHeatmapRows, getRows } from './data';

(window as any).agChartsDebug = 'scene:stats';

const SHADOW: AgDropShadowOptions = { enabled: true, fill: '#000', fillOpacity: 0.5, xOffset: 4, yOffset: 4, blur: 8 };
const SPREAD_SHADOW: AgDropShadowOptions = { ...SHADOW, spread: 14 };
const ITEM_SHADOW: AgDropShadowOptions = { fill: '#000', fillOpacity: 0.5, xOffset: 2, yOffset: 2, blur: 6 };
const GLOW: AgGlowOptions = { enabled: true, fill: '#000', fillOpacity: 0.35, blur: 6, spread: 14 };
const SERIES_GLOW: AgGlowOptions = { fillOpacity: 0.35, blur: 6, spread: 4 };
const GAP_GLOW: AgGlowOptions = { enabled: true, fill: '#000', fillOpacity: 0.35, blur: 6, spread: 8 };

/** The `glow.gap` of a gap scenario: left unset, or set to a number of pixels. */
type Gap = number | 'unset';
const GAPS: Gap[] = ['unset', 0, 5];

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getRows(20, 4, true),
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
    series: Array.from({ length: 4 }, (_, i) => ({
        type: 'bar' as const,
        xKey: 'x',
        yKey: `y${i}`,
        shadow: SPREAD_SHADOW,
    })),
};
/* @ag-options-end */

type Scenario =
    | 'bars'
    | 'areas'
    | 'highlight'
    | 'many-markers'
    | 'series-glow'
    | 'series-highlight'
    | 'item-shadow-bar'
    | 'item-shadow-scatter'
    | 'item-shadow-heatmap'
    | 'glow-gap-bar'
    | 'glow-gap-scatter';
type Variants = BenchmarkConfig['testCases'][number]['variants'];

// Each scenario overlaps the shadows of its series, with the shadow off in the first variant. Older builds ignore the options.
// `many-markers`, `series-glow` and `series-highlight` are 1,400px wide, as a line series draws no markers when its points are under 1px apart.
// `series-glow` sets the series-level `marker.glow`, which every highlight state inherits, so a hover recasts every series.
// `series-highlight` sets only `highlightedSeries.glow`, so the glow is cast only while a legend item is hovered.
// `item-shadow-bar`, `item-shadow-scatter` and `item-shadow-heatmap` set `highlightedItem.shadow` only, so the second variant adds
// the option itself. A hovered heatmap with the option set unbatches every cell, so it is measured at 100 x 100 cells.
// `glow-gap-bar` and `glow-gap-scatter` set the series-level `glow`, which every highlight state inherits, and vary its `gap`
// (unset, 0 or 5) instead of switching it on and off. Older builds ignore the option.
/** inScope */
function buildOptions(scenario: Scenario, shadowOn: boolean, gap: Gap = 'unset'): AgCartesianChartOptions {
    const shadow = <T extends AgDropShadowOptions>(value: T) => (shadowOn ? value : undefined);
    const gapGlow: AgGlowOptions = { ...GAP_GLOW, ...(gap === 'unset' ? {} : { gap }) };

    if (scenario === 'glow-gap-bar') {
        return {
            data: getRows(20, 4, true),
            axes: { x: { type: 'category' }, y: { type: 'number' } },
            series: Array.from({ length: 4 }, (_, i) => ({
                type: 'bar' as const,
                xKey: 'x',
                yKey: `y${i}`,
                glow: gapGlow,
            })),
        };
    }

    if (scenario === 'glow-gap-scatter') {
        return {
            width: 1400,
            height: 600,
            data: getRows(5000, 10, false),
            axes: { x: { type: 'number' }, y: { type: 'number' } },
            series: Array.from({ length: 10 }, (_, i) => ({
                type: 'scatter' as const,
                xKey: 'x',
                yKey: `y${i}`,
                size: 6,
                glow: gapGlow,
            })),
        };
    }

    if (scenario === 'bars') {
        return {
            data: getRows(20, 4, true),
            axes: { x: { type: 'category' }, y: { type: 'number' } },
            series: Array.from({ length: 4 }, (_, i) => ({
                type: 'bar' as const,
                xKey: 'x',
                yKey: `y${i}`,
                shadow: shadow(SPREAD_SHADOW),
            })),
        };
    }

    if (scenario === 'item-shadow-bar') {
        return {
            data: getRows(20, 4, true),
            axes: { x: { type: 'category' }, y: { type: 'number' } },
            series: Array.from({ length: 4 }, (_, i) => ({
                type: 'bar' as const,
                xKey: 'x',
                yKey: `y${i}`,
                shadow: SPREAD_SHADOW,
                highlight: { highlightedItem: { shadow: shadow(ITEM_SHADOW) } },
            })),
        };
    }

    if (scenario === 'item-shadow-scatter') {
        return {
            width: 1400,
            height: 600,
            data: getRows(5000, 10, false),
            axes: { x: { type: 'number' }, y: { type: 'number' } },
            series: Array.from({ length: 10 }, (_, i) => ({
                type: 'scatter' as const,
                xKey: 'x',
                yKey: `y${i}`,
                size: 6,
                highlight: { highlightedItem: { shadow: shadow(ITEM_SHADOW) } },
            })),
        };
    }

    if (scenario === 'item-shadow-heatmap') {
        return {
            width: 1400,
            height: 600,
            animation: { enabled: false },
            legend: { enabled: false },
            data: getHeatmapRows(100, 100),
            series: [
                {
                    type: 'heatmap' as const,
                    xKey: 'x',
                    yKey: 'y',
                    colorKey: 'level',
                    highlight: { highlightedItem: { shadow: shadow(ITEM_SHADOW) } },
                },
            ],
        };
    }

    if (scenario === 'series-glow' || scenario === 'series-highlight') {
        const atRest = scenario === 'series-glow';
        const glow = shadowOn ? SERIES_GLOW : undefined;
        return {
            width: 1400,
            height: 600,
            data: getRows(1000, 20, false),
            axes: { x: { type: 'number' }, y: { type: 'number' } },
            series: Array.from({ length: 20 }, (_, i) => ({
                type: 'line' as const,
                xKey: 'x',
                yKey: `y${i}`,
                marker: { enabled: true, size: 6, ...(atRest ? { glow } : undefined) },
                ...(atRest ? undefined : { highlight: { highlightedSeries: { glow } } }),
            })),
        };
    }

    if (scenario === 'many-markers') {
        return {
            width: 1400,
            height: 600,
            data: getRows(1000, 20, false),
            axes: { x: { type: 'number' }, y: { type: 'number' } },
            series: Array.from({ length: 20 }, (_, i) => ({
                type: 'line' as const,
                xKey: 'x',
                yKey: `y${i}`,
                marker: { enabled: true, size: 6, shadow: shadow(SHADOW) },
            })),
        };
    }

    const highlighted = scenario === 'highlight';
    return {
        data: getRows(200, 3, false),
        axes: { x: { type: 'number' }, y: { type: 'number' } },
        series: Array.from({ length: 3 }, (_, i) => ({
            type: 'area' as const,
            xKey: 'x',
            yKey: `y${i}`,
            fillOpacity: 0.6,
            shadow: shadow(SHADOW),
            marker: { enabled: true, size: 8, shadow: shadow(SHADOW) },
            ...(highlighted ? { highlight: { highlightedItem: { glow: shadowOn ? GLOW : undefined } } } : {}),
        })),
    };
}

const chartRef: ChartRef = { current: AgCharts.create(options) };
const container = document.getElementById('myChart')!;

let current: { scenario: Scenario; shadowOn: boolean; gap: Gap; options: AgCartesianChartOptions } | undefined;

// Rebuilds the chart for a scenario and shadow or gap setting, outside the timing, so that each variant starts afresh.
/** inScope */
async function prepare(scenario: Scenario, shadowOn: boolean, gap: Gap = 'unset'): Promise<AgCartesianChartOptions> {
    if (
        current?.scenario === scenario &&
        current.shadowOn === shadowOn &&
        current.gap === gap &&
        chartRef.current != null
    ) {
        return current.options;
    }

    chartRef.current?.destroy();
    chartRef.current = null;
    const next: AgCartesianChartOptions = { ...buildOptions(scenario, shadowOn, gap), container };
    current = { scenario, shadowOn, gap, options: next };
    chartRef.current = AgCharts.create(next);
    await chartRef.current.waitForUpdate();
    return next;
}

// Redraws the whole chart, from data that is new to it.
/** inScope */
async function performRedraw(chartOptions: AgCartesianChartOptions): Promise<number> {
    const data = (chartOptions.data ?? []).map((row) => ({ ...row }));

    const start = performance.now();
    await chartRef.current!.update({ ...chartOptions, data });
    return performance.now() - start;
}

// Redraws with new data for the first series only, so that the shadows of the others are unchanged.
/** inScope */
async function performRedrawFirstSeries(chartOptions: AgCartesianChartOptions): Promise<number> {
    const [first, ...others] = chartOptions.series ?? [];
    const data = (chartOptions.data ?? []).map((row) => ({ ...row }));

    const start = performance.now();
    await chartRef.current!.update({ ...chartOptions, series: [{ ...first, data }, ...others] });
    return performance.now() - start;
}

// Hovers the legend items in turn, as a pointer entering each does, so that each series is highlighted in its turn.
/** inScope */
async function performLegendHover(count: number): Promise<number> {
    const chart = chartRef.current!;
    const buttons = container.querySelectorAll('.ag-charts-proxy-legend-toolbar button');
    if (buttons.length === 0) throw new Error('No legend items found to hover');

    const start = performance.now();
    for (let i = 0; i < count; i++) {
        buttons[i % buttons.length].dispatchEvent(new MouseEvent('mouseenter'));
        await new Promise((resolve) => setTimeout(resolve, 0));
        await chart.waitForUpdate();
    }
    return performance.now() - start;
}

/** inScope */
function variantsOf(
    scenario: Scenario,
    operations: Record<string, (o: AgCartesianChartOptions) => Promise<number>>,
    optionName = 'Shadow'
) {
    const variants: Variants = [];
    for (const shadowOn of [false, true]) {
        for (const [operation, run] of Object.entries(operations)) {
            variants.push({
                params: { Operation: operation, [optionName]: shadowOn ? 'On' : 'Off' },
                run: async () => run(await prepare(scenario, shadowOn)),
            });
        }
    }
    return variants;
}

/** The variants of a gap scenario: every operation, with the glow's `gap` unset, 0 and 5. */
/** inScope */
function gapVariantsOf(
    scenario: Scenario,
    operations: Record<string, (o: AgCartesianChartOptions) => Promise<number>>
) {
    const variants: Variants = [];
    for (const gap of GAPS) {
        for (const [operation, run] of Object.entries(operations)) {
            variants.push({
                params: { Operation: operation, Gap: String(gap) },
                run: async () => run(await prepare(scenario, true, gap)),
            });
        }
    }
    return variants;
}

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    const create = (chartOptions: AgCartesianChartOptions) =>
        performInitialLoad(chartOptions, chartRef, (opts) => AgCharts.create(opts));

    return {
        testCases: [
            {
                id: 'bars-spread',
                label: 'Bars, shadow spread 14',
                variants: variantsOf('bars', { 'Chart Create': create, 'Chart Redraw': performRedraw }),
            },
            {
                id: 'areas-markers',
                label: 'Overlapping areas and markers',
                variants: variantsOf('areas', { 'Chart Create': create, 'Chart Redraw': performRedraw }),
            },
            {
                id: 'highlight',
                label: 'Highlighted marker glow',
                variants: variantsOf('highlight', {
                    'Hover x10': () => performDatumHighlight(chartRef.current!, container, 10),
                }),
            },
            {
                id: 'many-markers',
                label: '20 series x 1,000 points, marker shadows',
                variants: variantsOf('many-markers', { 'Chart Create': create, 'Chart Redraw': performRedraw }),
            },
            {
                id: 'one-series',
                label: 'One of 20 series updated, marker shadows',
                variants: variantsOf('many-markers', { 'Chart Redraw': performRedrawFirstSeries }),
            },
            {
                id: 'series-glow',
                label: '20 series x 1,000 points, series marker glow',
                variants: variantsOf(
                    'series-glow',
                    {
                        'Chart Create': create,
                        'Chart Redraw': performRedraw,
                        'Hover x10': () => performDatumHighlight(chartRef.current!, container, 10),
                    },
                    'Glow'
                ),
            },
            {
                id: 'series-highlight',
                label: '20 series x 1,000 points, highlighted series marker glow',
                variants: variantsOf('series-highlight', { 'Legend hover x10': () => performLegendHover(10) }, 'Glow'),
            },
            {
                id: 'item-shadow-bar',
                label: '4 bar series x 20 categories, highlightedItem.shadow',
                variants: variantsOf(
                    'item-shadow-bar',
                    { 'Hover x10': () => performDatumHighlight(chartRef.current!, container, 10) },
                    'Item Shadow'
                ),
            },
            {
                id: 'item-shadow-heatmap',
                label: 'Heatmap of 100 x 100 cells, highlightedItem.shadow',
                variants: variantsOf(
                    'item-shadow-heatmap',
                    { 'Hover x10': () => performDatumHighlight(chartRef.current!, container, 10) },
                    'Item Shadow'
                ),
            },
            {
                id: 'item-shadow-scatter',
                label: '10 scatter series x 5,000 points, highlightedItem.shadow',
                variants: variantsOf(
                    'item-shadow-scatter',
                    { 'Hover x10': () => performDatumHighlight(chartRef.current!, container, 10) },
                    'Item Shadow'
                ),
            },
            {
                id: 'glow-gap-bar',
                label: '4 bar series x 20 categories, glow.gap',
                variants: gapVariantsOf('glow-gap-bar', {
                    'Chart Create': create,
                    'Hover x10': () => performDatumHighlight(chartRef.current!, container, 10),
                }),
            },
            {
                id: 'glow-gap-scatter',
                label: '10 scatter series x 5,000 points, glow.gap',
                variants: gapVariantsOf('glow-gap-scatter', {
                    'Chart Create': create,
                    'Hover x10': () => performDatumHighlight(chartRef.current!, container, 10),
                }),
            },
        ],
        config: {
            updatesPerTest: 10,
            maxCollectionTimeMs: 30000,
            warmupUpdates: 2,
        },
        metadata: {
            version: VERSION,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
