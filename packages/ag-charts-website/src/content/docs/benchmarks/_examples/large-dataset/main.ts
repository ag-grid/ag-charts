// @ag-skip-fws

/* @ag-options-extract */
import {
    AgCartesianChartOptions,
    AgCharts,
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

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    return {
        testCases: [
            {
                id: 'initial-load',
                label: 'Initial Load',
                variants: [
                    {
                        params: { Operation: 'Chart Create' },
                        run: () => performInitialLoad(options, chartRef, (opts) => AgCharts.create(opts)),
                    },
                ],
            },
            {
                id: 'legend-toggle',
                label: 'Legend Toggle',
                variants: [
                    {
                        params: { Repetitions: '1x' },
                        run: () => performLegendToggle(chartRef.current!, options, visibilityState, 2), // Toggle on/off
                    },
                ],
            },
            {
                id: 'datum-highlight',
                label: 'Datum Highlight',
                variants: [
                    {
                        params: { Repetitions: '1x' },
                        run: () => performDatumHighlight(chartRef.current!, container, 1),
                    },
                    {
                        params: { Repetitions: '4x' },
                        run: () => performDatumHighlight(chartRef.current!, container, 4),
                    },
                ],
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
