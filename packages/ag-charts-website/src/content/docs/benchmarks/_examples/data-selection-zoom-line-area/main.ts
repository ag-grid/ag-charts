// @ag-skip-fws
/* @ag-options-extract */
import {
    AgCartesianAxisOptions,
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    AreaSeriesModule,
    CategoryAxisModule,
    LineSeriesModule,
    ModuleRegistry,
    NavigatorModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    RangeAreaSeriesModule,
    SelectionModule,
    VERSION,
    ZoomModule,
} from 'ag-charts-enterprise';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { ChartRef, clickAt, dragSelect, performZoom } from './benchmarkUtils';
import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    AreaSeriesModule,
    CategoryAxisModule,
    LineSeriesModule,
    NavigatorModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    RangeAreaSeriesModule,
    SelectionModule,
    ZoomModule,
]);

const DATAPOINTS = 1_000_000;
const ZOOM_REPS = 20;

const baseData = getData(DATAPOINTS);

const timeAxes: Record<string, AgCartesianAxisOptions> = {
    x: { type: 'ordinal-time', parentLevel: { enabled: true } },
};

const SERIES_TYPES = ['line', 'area', 'stacked-area', 'range-area'] as const;
type SeriesType = (typeof SERIES_TYPES)[number];

function buildSeries(type: SeriesType): AgCartesianChartOptions['series'] {
    switch (type) {
        case 'line':
        case 'area':
            return [{ type, xKey: 'timestamp', yKey: 'high', selection: { enabled: true } }];
        case 'stacked-area':
            return [
                { type: 'area', xKey: 'timestamp', yKey: 'open', stacked: true, selection: { enabled: true } },
                { type: 'area', xKey: 'timestamp', yKey: 'close', stacked: true, selection: { enabled: true } },
            ];
        case 'range-area':
            return [
                {
                    type,
                    xKey: 'timestamp',
                    yLowKey: 'low',
                    yHighKey: 'high',
                    selection: { enabled: true },
                },
            ];
    }
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: baseData,
    animation: { enabled: false },
    selection: {
        enabled: true,
        enableDrag: true,
    },
    zoom: {
        enabled: true,
        anchorPointX: 'pointer',
        anchorPointY: 'pointer',
        minVisibleItems: 0,
    },
    navigator: {
        enabled: true,
        miniChart: { enabled: true },
    },
    series: buildSeries('line'),
    axes: timeAxes,
};
/* @ag-options-end */

const chartRef: ChartRef = { current: AgCharts.create(options) };
const container = document.getElementById('myChart')!;

async function resetZoom(): Promise<void> {
    if (!chartRef.current) return;
    const state = chartRef.current.getState();
    await chartRef.current.setState({
        ...state,
        zoom: { ratioX: { start: 0, end: 1 }, ratioY: { start: 0, end: 1 } },
    });
    await chartRef.current.waitForUpdate();
}

async function selectFiftyPercent(): Promise<void> {
    const rect = container.querySelector('.ag-charts-series-area')!.getBoundingClientRect();
    const margin = 5;
    // Drag a horizontal band across the left half of the series area, full height.
    dragSelect(container, margin, margin, rect.width / 2, rect.height - margin);
    await chartRef.current!.waitForUpdate();
}

async function clearSelection(): Promise<void> {
    clickAt(container, 2, 2);
    await chartRef.current!.waitForUpdate();
}

async function applySeriesAndUpdate(type: SeriesType): Promise<void> {
    options.series = buildSeries(type);
    await chartRef.current!.update(options);
    await chartRef.current!.waitForUpdate();
}

// HTML control handlers — these need to be at module scope and globally callable
// from inline onclick attributes, so they're attached to window explicitly.
declare const window: Window & {
    setSeries?: (type: string) => void;
    selectHalf?: () => void;
    selectClear?: () => void;
};
window.setSeries = (type: string) => void applySeriesAndUpdate(type as SeriesType);
window.selectHalf = () => void selectFiftyPercent();
window.selectClear = () => void clearSelection();

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    const testCases = SERIES_TYPES.map((seriesType) => ({
        id: seriesType,
        label: seriesType,
        setup: () => applySeriesAndUpdate(seriesType),
        variants: [
            {
                params: { Selection: 'none' },
                run: async () => {
                    await resetZoom();
                    await clearSelection();
                    return performZoom(options, chartRef, (opts) => AgCharts.create(opts), container, ZOOM_REPS);
                },
            },
            {
                params: { Selection: '50%' },
                run: async () => {
                    await resetZoom();
                    await selectFiftyPercent();
                    return performZoom(options, chartRef, (opts) => AgCharts.create(opts), container, ZOOM_REPS);
                },
            },
        ],
    }));

    return {
        testCases,
        config: {
            updatesPerTest: 5,
            maxCollectionTimeMs: 60000,
            warmupUpdates: 1,
        },
        metadata: {
            dataPoints: DATAPOINTS,
            zoomReps: ZOOM_REPS,
            version: VERSION,
        },
        onComplete: clearSelection,
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
/* @ag-skip-clone */
