// @ag-skip-fws
/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts, AgItemShadowStyle, VERSION } from 'ag-charts-community';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { ChartRef, performDatumHighlight, performInitialLoad } from './benchmarkUtils';

// A distinct `blur` costs a blur pass per item, so a chart of 1,000 outlasts the update timeout: that case has fewer items.
// Its test case also times a shared shadow and glow and no styler at that size, to compare with.
const ITEMS = 1000;
const DISTINCT_ITEMS = 100;

type SeriesType = 'bar' | 'scatter';
type StylerMode = 'none' | 'neither' | 'shared' | 'distinct';

type Datum = { x: number; category: string; y: number; blur: number };

const data: Datum[] = Array.from({ length: ITEMS }, (_, i) => ({
    x: i,
    category: `C${i}`,
    y: 60 + Math.sin(i / 9) * 30,
    blur: 2 + i * 0.01,
}));

// Each returns a new object per item, as callers' functions do. 'neither' sets a field that every build supports.
const STYLERS: Record<
    Exclude<StylerMode, 'none'>,
    (params: { datum: Datum }) => AgItemShadowStyle & { fillOpacity?: number }
> = {
    neither: () => ({ fillOpacity: 0.9 }),
    shared: () => ({
        shadow: { xOffset: 2, yOffset: 2, blur: 4, fill: 'rgba(0, 0, 0, 0.4)' },
        glow: { blur: 6, fill: 'rgba(255, 200, 0, 0.6)' },
    }),
    distinct: ({ datum }) => ({
        shadow: { xOffset: 2, yOffset: 2, blur: datum.blur, fill: 'rgba(0, 0, 0, 0.4)' },
        glow: { blur: datum.blur + 2, fill: 'rgba(255, 200, 0, 0.6)' },
    }),
};

const MODE_LABELS: Record<StylerMode, string> = {
    none: 'No styler',
    neither: 'Styler, no shadow or glow',
    shared: 'Styler, one shared shadow and glow',
    distinct: 'Styler, a different blur per item',
};

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    animation: { enabled: false },
    legend: { enabled: false },
    data,
    axes: {
        x: { type: 'category' },
        y: { type: 'number', min: 0, max: 100 },
    },
    series: [{ type: 'bar', xKey: 'category', yKey: 'y' }],
};
/* @ag-options-end */

/** inScope */
function buildOptions(
    seriesType: SeriesType,
    mode: StylerMode,
    items: number,
    container: HTMLElement
): AgCartesianChartOptions {
    const itemStyler = mode === 'none' ? undefined : STYLERS[mode];
    return {
        ...options,
        container,
        data: data.slice(0, items),
        axes:
            seriesType === 'bar'
                ? { x: { type: 'category' }, y: { type: 'number', min: 0, max: 100 } }
                : { x: { type: 'number' }, y: { type: 'number', min: 0, max: 100 } },
        series: [
            seriesType === 'bar'
                ? { type: 'bar', xKey: 'category', yKey: 'y', itemStyler }
                : { type: 'scatter', xKey: 'x', yKey: 'y', itemStyler },
        ],
    };
}

const chartRef: ChartRef = { current: AgCharts.create(options) };
const container = document.getElementById('myChart')!;

let current: { seriesType: SeriesType; mode: StylerMode; items: number } | undefined;

// Rebuilds the chart for a series type and styler, outside the timing, so that each variant starts afresh.
/** inScope */
async function prepare(seriesType: SeriesType, mode: StylerMode, items: number) {
    if (
        current?.seriesType === seriesType &&
        current.mode === mode &&
        current.items === items &&
        chartRef.current != null
    ) {
        return;
    }

    chartRef.current?.destroy();
    chartRef.current = null;
    current = { seriesType, mode, items };
    chartRef.current = AgCharts.create(buildOptions(seriesType, mode, items, container));
    await chartRef.current.waitForUpdate();
}

// A build that can't take a `shadow` or `glow` from an `itemStyler` ignores them: compare those variants only to one that can.

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    const sizes: { suffix: string; items: number; modes: StylerMode[] }[] = [
        { suffix: '', items: ITEMS, modes: ['none', 'neither', 'shared'] },
        { suffix: '-distinct', items: DISTINCT_ITEMS, modes: ['none', 'shared', 'distinct'] },
    ];
    const testCases: BenchmarkConfig['testCases'] = [];
    for (const seriesType of ['bar', 'scatter'] as const) {
        for (const { suffix, items, modes } of sizes) {
            const variants: BenchmarkConfig['testCases'][number]['variants'] = [];
            for (const mode of modes) {
                const params = { Styler: MODE_LABELS[mode] };
                variants.push({
                    params: { ...params, Operation: 'Chart Create' },
                    run: () =>
                        performInitialLoad(buildOptions(seriesType, mode, items, container), chartRef, (opts) => {
                            current = undefined;
                            return AgCharts.create(opts);
                        }),
                });
                variants.push({
                    params: { ...params, Operation: 'Hover x10' },
                    run: async () => {
                        await prepare(seriesType, mode, items);
                        return performDatumHighlight(chartRef.current!, container, 10);
                    },
                });
            }
            testCases.push({
                id: `${seriesType}-item-styler${suffix}`,
                label: `${items} ${seriesType} items`,
                variants,
            });
        }
    }

    return {
        testCases,
        config: {
            updatesPerTest: 10,
            maxCollectionTimeMs: 30000,
            warmupUpdates: 2,
        },
        metadata: {
            items: ITEMS,
            distinctItems: DISTINCT_ITEMS,
            version: VERSION,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
