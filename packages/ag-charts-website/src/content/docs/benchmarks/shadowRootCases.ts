import type {
    AgCartesianChartOptions,
    AgChartInstance,
    AgDropShadowOptions,
    AgGlowOptions,
} from 'ag-charts-enterprise';

import type { BenchmarkConfig } from './benchmarkHarness';
import {
    ChartRef,
    hover as hoverAt,
    isReleaseBelow,
    performDatumHighlight,
    performInitialLoad,
    waitForAsyncEventTriggeredUpdate,
} from './benchmarkUtils';

// Shared by the shadow-root examples. The vanilla build loads it as a classic script beside main.js, so it takes the library
// and the page's `data.ts` from the caller, and its top-level names must not clash with those of any other file of the page.

const SHADOW: AgDropShadowOptions = { enabled: true, fill: '#000', fillOpacity: 0.5, xOffset: 4, yOffset: 4, blur: 8 };
const SPREAD_SHADOW: AgDropShadowOptions = { ...SHADOW, spread: 14 };
const ITEM_SHADOW: AgDropShadowOptions = { fill: '#000', fillOpacity: 0.5, xOffset: 2, yOffset: 2, blur: 6 };
const GLOW: AgGlowOptions = { enabled: true, fill: '#000', fillOpacity: 0.35, blur: 6, spread: 14 };
const SERIES_GLOW: AgGlowOptions = { fillOpacity: 0.35, blur: 6, spread: 4 };
const GAP_GLOW: AgGlowOptions = { enabled: true, fill: '#000', fillOpacity: 0.35, blur: 6, spread: 8 };

// A release before this casts only a series drop shadow with no fill or spread, and no glow, marker or highlight shadow.
const SHADOW_ROOT_MIN_VERSION = '15.0.0';

/** The `glow.gap` of a gap scenario: left unset, or set to a number of pixels. */
type Gap = number | 'unset';
const GAPS: Gap[] = ['unset', 0, 5];
const SERIES_POINTS = 5000;

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
    | 'glow-gap-scatter'
    | 'glow-gap-scatter-series'
    | 'theme-bar'
    | 'theme-scatter'
    | 'theme-heatmap';
/** The functions of `shadowRootData.ts`, which each page loads as its `data.ts`. */
export interface ShadowRootData {
    getRows(pointCount: number, seriesCount: number, categorical: boolean): Record<string, number | string>[];
    getHeatmapRows(columns: number, rows: number): { x: string; y: string; level: number }[];
}
type TestCase = BenchmarkConfig['testCases'][number];
type Variants = TestCase['variants'];
type Operation = (chartOptions: AgCartesianChartOptions) => Promise<number>;

export type ShadowRootCaseId =
    | 'bars-spread'
    | 'areas-markers'
    | 'highlight'
    | 'many-markers'
    | 'one-series'
    | 'series-glow'
    | 'series-highlight'
    | 'item-shadow-bar'
    | 'item-shadow-heatmap'
    | 'item-shadow-scatter'
    | 'glow-gap-bar'
    | 'glow-gap-scatter'
    | 'glow-gap-scatter-series'
    | 'theme-defaults';

// Each scenario overlaps the shadows of its series, with the shadow off in the first variant.
// `many-markers`, `series-glow` and `series-highlight` are 1,400px wide, as a line series draws no markers when its points are under 1px apart.
// `series-glow` sets the series-level `marker.glow`, which every highlight state inherits, so a hover recasts every series.
// `series-highlight` sets only `highlightedSeries.glow`, so the glow is cast only while a legend item is hovered.
// `item-shadow-bar`, `item-shadow-scatter` and `item-shadow-heatmap` set `highlightedItem.shadow` only, so the second variant adds
// the option itself. A hovered heatmap with the option set unbatches every cell, so it is measured at 100 x 100 cells.
// `glow-gap-bar` and `glow-gap-scatter` set the series-level `glow`, which every highlight state inherits, and vary its `gap`
// (unset, 0 or 5) instead of switching it on and off.
// `theme-bar`, `theme-scatter` and `theme-heatmap` set none of `highlight`, `glow` or `shadow`, so hovering measures the theme defaults.
function buildShadowRootOptions(
    { getRows, getHeatmapRows }: ShadowRootData,
    scenario: Scenario,
    shadowOn: boolean,
    gap: Gap = 'unset'
): AgCartesianChartOptions {
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

    if (scenario === 'glow-gap-scatter-series') {
        // The axes are fixed to the data, so that the pixel of each point of the first series is known to the hover.
        const data = getRows(SERIES_POINTS, 10, false);
        const ys = data.flatMap((row) =>
            Object.keys(row)
                .filter((key) => key !== 'x')
                .map((key) => Number(row[key]))
        );
        return {
            width: 1400,
            height: 600,
            data,
            axes: {
                x: { type: 'number', min: 0, max: SERIES_POINTS - 1, nice: false },
                y: { type: 'number', min: Math.min(...ys), max: Math.max(...ys), nice: false },
            },
            series: Array.from({ length: 10 }, (_, i) => ({
                type: 'scatter' as const,
                xKey: 'x',
                yKey: `y${i}`,
                size: 6,
                glow: gapGlow,
            })),
        };
    }

    if (scenario === 'theme-bar') {
        return {
            data: getRows(20, 4, true),
            axes: { x: { type: 'category' }, y: { type: 'number' } },
            series: Array.from({ length: 4 }, (_, i) => ({ type: 'bar' as const, xKey: 'x', yKey: `y${i}` })),
        };
    }

    if (scenario === 'theme-scatter') {
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
            })),
        };
    }

    if (scenario === 'theme-heatmap') {
        return {
            width: 1400,
            height: 600,
            animation: { enabled: false },
            legend: { enabled: false },
            data: getHeatmapRows(100, 100),
            series: [{ type: 'heatmap' as const, xKey: 'x', yKey: 'y', colorKey: 'level' }],
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

/**
 * The config of a page of shadow-root cases, in the order given. `createChart`, `version` and `data` come from the page's own
 * imports of the library and of its `data.ts`.
 */
export function getShadowRootConfig(
    caseIds: ShadowRootCaseId[],
    initialChart: AgChartInstance,
    createChart: (options: AgCartesianChartOptions) => AgChartInstance,
    version: string,
    data: ShadowRootData
): BenchmarkConfig {
    const container = document.getElementById('myChart')!;
    const chartRef: ChartRef = { current: initialChart };
    const shadowsSupported = !isReleaseBelow(version, SHADOW_ROOT_MIN_VERSION);
    let current: { scenario: Scenario; shadowOn: boolean; gap: Gap; options: AgCartesianChartOptions } | undefined;

    // Rebuilds the chart for a scenario and shadow or gap setting, outside the timing, so that each variant starts afresh.
    const prepare = async (scenario: Scenario, shadowOn: boolean, gap: Gap = 'unset') => {
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
        const next: AgCartesianChartOptions = { ...buildShadowRootOptions(data, scenario, shadowOn, gap), container };
        current = { scenario, shadowOn, gap, options: next };
        chartRef.current = createChart(next);
        await chartRef.current.waitForUpdate();
        return next;
    };

    const create: Operation = (chartOptions) => performInitialLoad(chartOptions, chartRef, createChart);
    const hover: Operation = () => performDatumHighlight(chartRef.current!, container, 10);

    // Hovers consecutive points of the first series, so that each move is between items of one series.
    const seriesHover: Operation = async (chartOptions) => {
        const rows = chartOptions.data ?? [];
        const yAxis = chartOptions.axes?.y as { min: number; max: number };
        const seriesArea = container.querySelector('.ag-charts-series-area') as HTMLElement;
        const { width, height } = seriesArea.getBoundingClientRect();
        const middle = Math.floor(rows.length / 2);

        const start = performance.now();
        for (let i = 0; i < 10; i++) {
            const row = rows[middle + i * 10];
            const x = (Number(row.x) / (rows.length - 1)) * width;
            const y = (1 - (Number(row.y0) - yAxis.min) / (yAxis.max - yAxis.min)) * height;
            hoverAt(container, x, y);
            await waitForAsyncEventTriggeredUpdate(chartRef.current!);
        }

        seriesArea.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
        return performance.now() - start;
    };

    // Redraws the whole chart, from data that is new to it.
    const redraw: Operation = async (chartOptions) => {
        const data = (chartOptions.data ?? []).map((row) => ({ ...row }));

        const start = performance.now();
        await chartRef.current!.update({ ...chartOptions, data });
        return performance.now() - start;
    };

    // Redraws with new data for the first series only, so that the shadows of the others are unchanged.
    const redrawFirstSeries: Operation = async (chartOptions) => {
        const [first, ...others] = chartOptions.series ?? [];
        const data = (chartOptions.data ?? []).map((row) => ({ ...row }));

        const start = performance.now();
        await chartRef.current!.update({ ...chartOptions, series: [{ ...first, data }, ...others] });
        return performance.now() - start;
    };

    // Hovers the legend items in turn, as a pointer entering each does, so that each series is highlighted in its turn.
    const legendHover: Operation = async () => {
        const chart = chartRef.current!;
        const buttons = container.querySelectorAll('.ag-charts-proxy-legend-toolbar button');
        if (buttons.length === 0) throw new Error('No legend items found to hover');

        const start = performance.now();
        for (let i = 0; i < 10; i++) {
            buttons[i % buttons.length].dispatchEvent(new MouseEvent('mouseenter'));
            await new Promise((resolve) => setTimeout(resolve, 0));
            await chart.waitForUpdate();
        }
        return performance.now() - start;
    };

    const variantsOf = (scenario: Scenario, operations: Record<string, Operation>, optionName = 'Shadow') => {
        const variants: Variants = [];
        for (const shadowOn of [false, true]) {
            // The bars of `item-shadow-bar` keep a spread shadow with the item shadow off.
            const castsShadow = shadowOn || scenario === 'item-shadow-bar';
            for (const [operation, run] of Object.entries(operations)) {
                variants.push({
                    params: { Operation: operation, [optionName]: shadowOn ? 'On' : 'Off' },
                    available: shadowsSupported || !castsShadow,
                    run: async () => run(await prepare(scenario, shadowOn)),
                });
            }
        }
        return variants;
    };

    /** The variants of a gap scenario: every operation, with the glow's `gap` unset, 0 and 5. */
    const gapVariantsOf = (scenario: Scenario, operations: Record<string, Operation>) => {
        const variants: Variants = [];
        for (const gap of GAPS) {
            for (const [operation, run] of Object.entries(operations)) {
                variants.push({
                    params: { Operation: operation, Gap: String(gap) },
                    available: shadowsSupported,
                    run: async () => run(await prepare(scenario, true, gap)),
                });
            }
        }
        return variants;
    };

    /** The variants of the theme defaults case: a hover on each chart, none of which sets an option that the theme defaults. */
    const themeVariants = (): Variants =>
        (
            [
                ['Bar', 'theme-bar'],
                ['Scatter', 'theme-scatter'],
                ['Heatmap', 'theme-heatmap'],
            ] as const
        ).map(([chart, scenario]) => ({
            params: { Operation: 'Hover x10', Chart: chart },
            run: async () => hover(await prepare(scenario, false)),
        }));

    const cases: Record<ShadowRootCaseId, () => TestCase> = {
        'bars-spread': () => ({
            id: 'bars-spread',
            label: 'Bars, shadow spread 14',
            variants: variantsOf('bars', { 'Chart Create': create, 'Chart Redraw': redraw }),
        }),
        'areas-markers': () => ({
            id: 'areas-markers',
            label: 'Overlapping areas and markers',
            variants: variantsOf('areas', { 'Chart Create': create, 'Chart Redraw': redraw }),
        }),
        highlight: () => ({
            id: 'highlight',
            label: 'Highlighted marker glow',
            variants: variantsOf('highlight', { 'Hover x10': hover }),
        }),
        'many-markers': () => ({
            id: 'many-markers',
            label: '20 series x 1,000 points, marker shadows',
            variants: variantsOf('many-markers', { 'Chart Create': create, 'Chart Redraw': redraw }),
        }),
        'one-series': () => ({
            id: 'one-series',
            label: 'One of 20 series updated, marker shadows',
            variants: variantsOf('many-markers', { 'Chart Redraw': redrawFirstSeries }),
        }),
        'series-glow': () => ({
            id: 'series-glow',
            label: '20 series x 1,000 points, series marker glow',
            variants: variantsOf(
                'series-glow',
                { 'Chart Create': create, 'Chart Redraw': redraw, 'Hover x10': hover },
                'Glow'
            ),
        }),
        'series-highlight': () => ({
            id: 'series-highlight',
            label: '20 series x 1,000 points, highlighted series marker glow',
            variants: variantsOf('series-highlight', { 'Legend hover x10': legendHover }, 'Glow'),
        }),
        'item-shadow-bar': () => ({
            id: 'item-shadow-bar',
            label: '4 bar series x 20 categories, highlightedItem.shadow',
            variants: variantsOf('item-shadow-bar', { 'Hover x10': hover }, 'Item Shadow'),
        }),
        'item-shadow-heatmap': () => ({
            id: 'item-shadow-heatmap',
            label: 'Heatmap of 100 x 100 cells, highlightedItem.shadow',
            variants: variantsOf('item-shadow-heatmap', { 'Hover x10': hover }, 'Item Shadow'),
        }),
        'item-shadow-scatter': () => ({
            id: 'item-shadow-scatter',
            label: '10 scatter series x 5,000 points, highlightedItem.shadow',
            variants: variantsOf('item-shadow-scatter', { 'Hover x10': hover }, 'Item Shadow'),
        }),
        'glow-gap-bar': () => ({
            id: 'glow-gap-bar',
            label: '4 bar series x 20 categories, glow.gap',
            variants: gapVariantsOf('glow-gap-bar', { 'Chart Create': create, 'Hover x10': hover }),
        }),
        'glow-gap-scatter': () => ({
            id: 'glow-gap-scatter',
            label: '10 scatter series x 5,000 points, glow.gap',
            variants: gapVariantsOf('glow-gap-scatter', { 'Chart Create': create, 'Hover x10': hover }),
        }),
        'glow-gap-scatter-series': () => ({
            id: 'glow-gap-scatter-series',
            label: '10 scatter series x 5,000 points, glow.gap, moves within one series',
            variants: gapVariantsOf('glow-gap-scatter-series', { 'Hover x10 (one series)': seriesHover }),
        }),
        'theme-defaults': () => ({
            id: 'theme-defaults',
            label: 'Theme defaults',
            variants: themeVariants(),
        }),
    };

    return {
        warnings: shadowsSupported
            ? undefined
            : [`Skipped the variants that cast a shadow or glow (requires >= ${SHADOW_ROOT_MIN_VERSION})`],
        testCases: caseIds.map((id) => cases[id]()),
        config: {
            updatesPerTest: 10,
            maxCollectionTimeMs: 30000,
            warmupUpdates: 2,
        },
        metadata: {
            version,
        },
    };
}
