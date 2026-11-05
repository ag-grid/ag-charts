// @ag-skip-fws
/* @ag-options-extract */
import {
    AgCartesianChartOptions,
    AgCharts,
    AgDropShadowOptions,
    BarSeriesModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    ScatterSeriesModule,
    TimeAxisModule,
    VERSION,
} from 'ag-charts-community';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import {
    ChartRef,
    SeriesVisibilityState,
    isVersionStringAtOrAfter,
    performDatumHighlight,
    performInitialLoad,
    performLegendToggle,
} from './benchmarkUtils';
import { getLargeScaleData } from './data';

ModuleRegistry.registerModules([
    BarSeriesModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    ScatterSeriesModule,
    TimeAxisModule,
]);

(window as any).agChartsDebug = 'scene:stats';

const size = 100_000;
const highlightTheme = {
    series: {
        highlight: {
            unhighlightedSeries: {
                opacity: 0.2,
            },
        },
    },
};

const visibleCount = 1;
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    theme: {
        overrides: {
            line: highlightTheme,
            scatter: highlightTheme,
            area: highlightTheme,
            bar: highlightTheme,
        },
    },
    axes: {
        x: { type: 'time' },
    },
    data: getLargeScaleData(size),
    series: [
        {
            type: 'scatter',
            xKey: 'time',
            yKey: 'value',
            title: 'Scatter',
            shape: 'circle',
            visible: visibleCount >= 1,
            // disable high performance optimisations
            maxRenderedItems: 1_000_000,
        },
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
            title: 'Line',
            marker: { enabled: true },
            visible: visibleCount >= 2,
        },
        // Disabled to allow retrospective execution for b9.1.1
        // {
        //     type: 'area',
        //     xKey: 'time',
        //     yKey: 'value',
        //     yName: 'Area',
        //     marker: { enabled: true },
        //     visible: visibleCount >= 3,
        // },
        {
            type: 'bar',
            xKey: 'time',
            yKey: 'value',
            yName: 'bar',
            visible: visibleCount >= 4,
        },
    ],
};
/* @ag-options-end */

const chartRef: ChartRef = { current: AgCharts.create(options) };
const container = document.getElementById('myChart')!;

// Store series visibility states
const seriesCount = options.series!.length;
const visibilityState: SeriesVisibilityState = { visible: options.series!.map((s) => s.visible !== false) };

type ShadowMode = 'off' | 'on' | 'spread';
type Variants = BenchmarkConfig['testCases'][number]['variants'];

// These variants time the series with its shadow off, on, and on with a `spread`. A shadow is blurred once per layer, so
// on and off should be close.
// The shadow `spread`, and the `shadow` of candlestick and OHLC series, are first in 14.3.0. Older releases ignore them, so
// they are skipped there, or they would do less work than this version does. Builds that still report 14.2.0 skip them too.
const SHADOW_MIN_VERSION = '14.3.0';
const SHADOWS: Record<'on' | 'spread', AgDropShadowOptions> = {
    on: { enabled: true, color: 'rgba(0, 0, 0, 0.5)', xOffset: 2, yOffset: 2, blur: 4 },
    spread: { enabled: true, color: 'rgba(0, 0, 0, 0.5)', xOffset: 2, yOffset: 2, blur: 4, spread: 2 },
};
const SHADOW_LABELS: Record<'on' | 'spread', string> = { on: 'On', spread: 'On, with spread' };

const shadowSeries = options.series![0] as { shadow?: AgDropShadowOptions };
let shadowMode: ShadowMode = 'off';

// Switches the series shadow, which is off unless set. Rebuilds the chart, outside the timing, so each variant starts afresh.
/** inScope */
async function prepareShadow(mode: ShadowMode): Promise<void> {
    if (mode === shadowMode) return;

    shadowMode = mode;
    if (mode === 'off') {
        delete shadowSeries.shadow;
    } else {
        shadowSeries.shadow = SHADOWS[mode];
    }
    chartRef.current?.destroy();
    chartRef.current = AgCharts.create(options);
    visibilityState.visible = options.series!.map((s) => s.visible !== false);
    await chartRef.current.waitForUpdate();
}

// The variants of a test case: as given, with the series shadow off, then again with it on and with a `spread`.
/** inScope */
function withShadowModes(variants: Variants): Variants {
    const withMode = (mode: ShadowMode, params?: Record<string, string>) =>
        variants.map((variant) => ({
            ...variant,
            params: { ...variant.params, ...params },
            // The later of the variant's own minimum and the one for the shadow.
            minVersion:
                mode !== 'off' &&
                (variant.minVersion == null || isVersionStringAtOrAfter(SHADOW_MIN_VERSION, variant.minVersion))
                    ? SHADOW_MIN_VERSION
                    : variant.minVersion,
            run: async () => {
                await prepareShadow(mode);
                return variant.run();
            },
        }));

    return [
        ...withMode('off'),
        ...(['on', 'spread'] as const).flatMap((mode) => withMode(mode, { Shadow: SHADOW_LABELS[mode] })),
    ];
}

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    return {
        testCases: [
            {
                id: 'initial-load',
                label: 'Initial Load',
                variants: withShadowModes([
                    {
                        params: { Operation: 'Chart Create' },
                        run: () => performInitialLoad(options, chartRef, (opts) => AgCharts.create(opts)),
                    },
                ]),
            },
            {
                id: 'legend-toggle',
                label: 'Legend Toggle',
                variants: withShadowModes([
                    {
                        params: { Repetitions: '1x' },
                        run: () => performLegendToggle(chartRef.current!, options, visibilityState, 2), // Toggle on/off
                    },
                ]),
            },
            {
                id: 'datum-highlight',
                label: 'Datum Highlight',
                variants: withShadowModes([
                    {
                        params: { Repetitions: '1x' },
                        run: () => performDatumHighlight(chartRef.current!, container, 1),
                    },
                    {
                        params: { Repetitions: '4x' },
                        run: () => performDatumHighlight(chartRef.current!, container, 4),
                    },
                ]),
            },
        ],
        config: {
            updatesPerTest: 10,
            maxCollectionTimeMs: 30000,
            warmupUpdates: 2,
        },
        metadata: {
            dataPoints: size,
            seriesCount: seriesCount,
            version: VERSION,
            expectedRetainedSizeMB: 55,
            expectedCanvasCount: 5,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
