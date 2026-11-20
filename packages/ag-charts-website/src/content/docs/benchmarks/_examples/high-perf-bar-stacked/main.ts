// @ag-skip-fws
/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts, VERSION } from 'ag-charts-enterprise';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { ChartRef, isReleaseBelow, performDatumHighlight, performInitialLoad, performZoom } from './benchmarkUtils';
import { getData } from './data';

(window as any).agChartsDebug = 'scene:stats:verbose';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    animation: { enabled: false },
    zoom: {
        enabled: true,
        anchorPointX: 'pointer',
        anchorPointY: 'pointer',
        minVisibleItems: 0,
    },
    navigator: {
        enabled: true,
    },
    series: [
        {
            type: 'bar',
            xKey: 'timestamp',
            yKey: 'open',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'timestamp',
            yKey: 'close',
            stacked: true,
        },
    ],
    axes: {
        x: { type: 'unit-time' },
    },
};
/* @ag-options-end */

const chartRef: ChartRef = { current: AgCharts.create(options) };
const container = document.getElementById('myChart')!;

const seriesCount = options.series!.length;
const data = getData();

// The first release with the `gap` option.
const GAP_MIN_VERSION = '14.3.0';
const GAP = 4;
// Below AGGREGATION_THRESHOLD (1,000), so the bars are drawn individually rather than aggregated.
const UNAGGREGATED_POINTS = 900;
const HOVER_POSITIONS = 20;

const withGap = (source: AgCartesianChartOptions): AgCartesianChartOptions => ({
    ...source,
    series: source.series!.map((series) => ({ ...series, gap: GAP }) as typeof series),
});
const gapOptions = withGap(options);
const unaggregatedOptions: AgCartesianChartOptions = { ...options, data: data.slice(0, UNAGGREGATED_POINTS) };
const unaggregatedGapOptions = withGap(unaggregatedOptions);

// The options the chart in `chartRef` was last built with.
let builtWith: AgCartesianChartOptions = options;

/** inScope */
async function chartCreate(chartOptions: AgCartesianChartOptions): Promise<number> {
    const elapsed = await performInitialLoad(chartOptions, chartRef, (opts) => AgCharts.create(opts));
    builtWith = chartOptions;
    return elapsed;
}

// Runs an operation on a chart built with the given options. A chart left by an earlier variant with other options
// is rebuilt first, before the timed section, so each variant starts from the same state wherever it runs.
/** inScope */
async function onChart(chartOptions: AgCartesianChartOptions, run: () => Promise<number>): Promise<number> {
    if (builtWith !== chartOptions) {
        chartRef.current?.destroy();
        chartRef.current = AgCharts.create(chartOptions);
        builtWith = chartOptions;
    }
    await chartRef.current!.waitForUpdate();
    return run();
}

/** inScope */
function supportsGap(): boolean {
    return !isReleaseBelow(VERSION, GAP_MIN_VERSION);
}

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    // The gap variants are appended after the existing ones, so those keep their run position and starting state.
    // A published base without the option draws no gap, so only its variants are skipped, not the example.
    const gapAvailable = supportsGap();
    return {
        warnings: gapAvailable ? undefined : [`Gap variants skipped (requires >= ${GAP_MIN_VERSION})`],
        testCases: [
            {
                id: 'initial-load',
                label: 'Initial Load',
                variants: [
                    {
                        params: { Operation: 'Chart Create' },
                        run: () => chartCreate(options),
                    },
                    {
                        params: { Operation: 'Chart Create', Gap: `${GAP}px` },
                        available: gapAvailable,
                        run: () => chartCreate(gapOptions),
                    },
                ],
            },
            {
                id: 'zoom',
                label: 'Zoom',
                variants: [
                    {
                        params: { Repetitions: '20x' },
                        run: () =>
                            onChart(options, () =>
                                performZoom(options, chartRef, (opts) => AgCharts.create(opts), container, 20)
                            ),
                    },
                    {
                        params: { Repetitions: '20x', Gap: `${GAP}px` },
                        available: gapAvailable,
                        run: () =>
                            onChart(gapOptions, () =>
                                performZoom(gapOptions, chartRef, (opts) => AgCharts.create(opts), container, 20)
                            ),
                    },
                ],
            },
            {
                id: 'initial-load-unaggregated',
                label: `Initial Load (${UNAGGREGATED_POINTS} points, not aggregated)`,
                variants: [
                    {
                        params: { Operation: 'Chart Create' },
                        run: () => chartCreate(unaggregatedOptions),
                    },
                    {
                        params: { Operation: 'Chart Create', Gap: `${GAP}px` },
                        available: gapAvailable,
                        run: () => chartCreate(unaggregatedGapOptions),
                    },
                ],
            },
            {
                id: 'hover',
                label: 'Datum Highlight',
                variants: [
                    {
                        params: { Positions: `${HOVER_POSITIONS}x` },
                        run: () =>
                            onChart(options, () =>
                                performDatumHighlight(chartRef.current!, container, HOVER_POSITIONS)
                            ),
                    },
                    {
                        params: { Positions: `${HOVER_POSITIONS}x`, Gap: `${GAP}px` },
                        available: gapAvailable,
                        run: () =>
                            onChart(gapOptions, () =>
                                performDatumHighlight(chartRef.current!, container, HOVER_POSITIONS)
                            ),
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
            dataPoints: data.length,
            seriesCount: seriesCount,
            seriesType: 'bar-stacked',
            version: VERSION,
            expectedRetainedSizeMB: 100,
            expectedCanvasCount: 5,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
