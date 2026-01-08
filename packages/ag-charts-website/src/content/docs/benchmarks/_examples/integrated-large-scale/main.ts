// @ag-skip-fws

/* @ag-options-extract */
import { AgCartesianChartOptions, AgCharts, VERSION } from 'ag-charts-community';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { ChartRef, SeriesVisibilityState, performInitialLoad, performLegendToggle } from './benchmarkUtils';
import { integratedChartOptions } from './data';

(window as any).agChartsDebug = 'scene:stats';

const options: AgCartesianChartOptions = {
    ...integratedChartOptions,
    container: document.getElementById('myChart'),
};
/* @ag-options-end */

const chartRef: ChartRef = { current: AgCharts.create(options) };

// Store series visibility states
const seriesCount = options.series?.length ?? 0;
const visibilityState: SeriesVisibilityState = { visible: new Array(seriesCount).fill(true) };

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
                    {
                        params: { Repetitions: '4x' },
                        run: () => performLegendToggle(chartRef.current!, options, visibilityState, 4),
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
            dataPoints: options.data?.length ?? 0,
            seriesCount: seriesCount,
            version: VERSION,
            expectedRetainedSizeMB: 18,
            expectedCanvasCount: 5,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
