// @ag-skip-fws
/* @ag-options-extract */
import {
    AgCartesianChartOptions,
    AgCharts,
    AgOrdinalTimeAxisOptions,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NavigatorModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
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
    OrdinalTimeAxisModule,
    ZoomModule,
]);

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
            type: 'line',
            xKey: 'timestamp',
            yKey: 'price',
            marker: { enabled: false },
        },
    ],
    axes: {
        x: { type: 'ordinal-time', parentLevel: { enabled: false } },
    },
};
/* @ag-options-end */

const chartRef: ChartRef = { current: AgCharts.create(options) };
const container = document.getElementById('myChart')!;

const seriesCount = options.series!.length;
const data = getData();

function setParentLevel(enabled: boolean) {
    (options.axes!.x! as AgOrdinalTimeAxisOptions).parentLevel = { enabled };
    chartRef.current?.update(options);
}

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
            axisType: 'ordinal-time',
            version: VERSION,
            expectedRetainedSizeMB: 60,
            expectedCanvasCount: 5,
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
