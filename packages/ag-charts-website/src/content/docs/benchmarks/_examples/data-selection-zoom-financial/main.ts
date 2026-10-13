// @ag-skip-fws
/* @ag-options-extract */
import {
    AgCartesianAxisOptions,
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    CandlestickSeriesModule,
    HlcSeriesModule,
    ModuleRegistry,
    NavigatorModule,
    NumberAxisModule,
    OhlcSeriesModule,
    OrdinalTimeAxisModule,
    SelectionModule,
    VERSION,
    ZoomModule,
} from 'ag-charts-enterprise';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { ChartRef, clickAt, dragSelect, isReleaseBelow, performZoom } from './benchmarkUtils';
import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CandlestickSeriesModule,
    HlcSeriesModule,
    NavigatorModule,
    NumberAxisModule,
    OhlcSeriesModule,
    OrdinalTimeAxisModule,
    SelectionModule,
    ZoomModule,
]);

const DATAPOINTS = 1_000_000;
const ZOOM_REPS = 20;

const baseData = getData(DATAPOINTS);

const timeAxes: Record<string, AgCartesianAxisOptions> = {
    x: { type: 'ordinal-time', parentLevel: { enabled: true } },
};

const SERIES_TYPES = ['candlestick', 'ohlc', 'hlc'] as const;
type SeriesType = (typeof SERIES_TYPES)[number];

const HLC_MIN_VERSION = '14.3.0';

function buildSeries(type: SeriesType): AgCartesianChartOptions['series'] {
    const selection = {
        enabled: true,
        selectedItem: { fill: '#ff3b30', stroke: '#990000', strokeWidth: 2 },
    };
    if (type === 'hlc') {
        return [{ type, xKey: 'timestamp', lowKey: 'low', highKey: 'high', closeKey: 'close', selection }];
    }
    return [
        {
            type,
            xKey: 'timestamp',
            lowKey: 'low',
            highKey: 'high',
            openKey: 'open',
            closeKey: 'close',
            selection,
        },
    ];
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
    series: buildSeries('candlestick'),
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
function isSeriesSupported(seriesType: SeriesType): boolean {
    return seriesType !== 'hlc' || !isReleaseBelow(VERSION, HLC_MIN_VERSION);
}

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    const testCases = SERIES_TYPES.map((seriesType) => ({
        id: seriesType,
        label: seriesType,
        // The runner calls setup() before filtering unavailable variants, so don't switch to an unsupported series.
        setup: isSeriesSupported(seriesType) ? () => applySeriesAndUpdate(seriesType) : undefined,
        variants: [
            {
                available: isSeriesSupported(seriesType),
                params: { Selection: 'none' },
                run: async () => {
                    await resetZoom();
                    await clearSelection();
                    return performZoom(options, chartRef, (opts) => AgCharts.create(opts), container, ZOOM_REPS);
                },
            },
            {
                available: isSeriesSupported(seriesType),
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
        warnings: isSeriesSupported('hlc') ? undefined : [`Skipped (the hlc series requires >= ${HLC_MIN_VERSION})`],
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
