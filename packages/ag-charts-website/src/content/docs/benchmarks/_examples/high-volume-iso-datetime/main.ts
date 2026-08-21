// @ag-skip-fws
/* @ag-options-extract */
import {
    AgCartesianChartOptions,
    AgCharts,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NavigatorModule,
    NumberAxisModule,
    TimeAxisModule,
    VERSION,
    ZoomModule,
} from 'ag-charts-enterprise';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { ChartRef, performInitialLoad, performZoom } from './benchmarkUtils';
import { getData } from './data';

ModuleRegistry.registerModules([
    LegendModule,
    LineSeriesModule,
    NavigatorModule,
    NumberAxisModule,
    TimeAxisModule,
    ZoomModule,
]);

(window as any).agChartsDebug = 'scene:stats:verbose';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    // `data` is assigned after the extract block so the million-row generated dataset does not bloat the
    // options-extraction output; the benchmark fills it in before any run.
    data: [],
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
            type: 'line',
            xKey: 'timestamp',
            yKey: 'price',
            marker: { enabled: false },
        },
    ],
    axes: {
        x: { type: 'time', nice: false },
    },
};
/* @ag-options-end */

const data = getData();
options.data = data;

const chartRef: ChartRef = { current: AgCharts.create(options) };
const container = document.getElementById('myChart')!;

const seriesCount = options.series!.length;

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
                id: 'zoom',
                label: 'Zoom',
                variants: [
                    {
                        params: { Repetitions: '20x' },
                        run: () => performZoom(options, chartRef, (opts) => AgCharts.create(opts), container, 20),
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
            axisType: 'time',
            dataType: 'iso-8601-string',
            version: VERSION,
            // ISO-8601 time-axis strings are a new feature; an older published base renders no
            // valid data points, so the compare step skips this example when below minVersion.
            minVersion: '14.0.0',
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
