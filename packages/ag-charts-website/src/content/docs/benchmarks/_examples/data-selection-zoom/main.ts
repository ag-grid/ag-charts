// @ag-skip-fws
/* @ag-options-extract */
import {
    AgCartesianAxisOptions,
    AgCartesianChartOptions,
    AgCharts,
    AgSelectionItemIds,
    AnimationModule,
    AreaSeriesModule,
    BarSeriesModule,
    BubbleSeriesModule,
    CandlestickSeriesModule,
    CategoryAxisModule,
    HistogramSeriesModule,
    LineSeriesModule,
    ModuleRegistry,
    NavigatorModule,
    NumberAxisModule,
    OhlcSeriesModule,
    OrdinalTimeAxisModule,
    RangeAreaSeriesModule,
    RangeBarSeriesModule,
    ScatterSeriesModule,
    SelectionModule,
    TimeAxisModule,
    VERSION,
    ZoomModule,
} from 'ag-charts-enterprise';

import { type BenchmarkConfig, initBenchmark } from './benchmarkHarness';
import { ChartRef, performZoom } from './benchmarkUtils';
import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    AreaSeriesModule,
    BarSeriesModule,
    BubbleSeriesModule,
    CandlestickSeriesModule,
    HistogramSeriesModule,
    LineSeriesModule,
    NavigatorModule,
    NumberAxisModule,
    OhlcSeriesModule,
    OrdinalTimeAxisModule,
    RangeAreaSeriesModule,
    RangeBarSeriesModule,
    ScatterSeriesModule,
    SelectionModule,
    TimeAxisModule,
    ZoomModule,
    CategoryAxisModule,
]);

const DATAPOINTS = 1_000_000;
const ZOOM_REPS = 20;

const baseData = getData(DATAPOINTS);

const timeAxes: Record<string, AgCartesianAxisOptions> = {
    x: { type: 'ordinal-time', parentLevel: { enabled: true } },
};

const SERIES_TYPES = [
    'line',
    'area',
    'bar',
    'stacked-bar',
    'stacked-area',
    'range-area',
    'range-bar',
    'candlestick',
    'ohlc',
    'scatter',
    'bubble',
    'histogram',
] as const;
type SeriesType = (typeof SERIES_TYPES)[number];

function buildSeries(type: SeriesType): AgCartesianChartOptions['series'] {
    const id0 = 'bench-series-0';
    const id1 = 'bench-series-1';
    switch (type) {
        case 'line':
        case 'area':
        case 'bar':
            return [{ type, id: id0, xKey: 'timestamp', yKey: 'high', selection: { enabled: true } }];
        case 'stacked-bar':
        case 'stacked-area': {
            const t = type === 'stacked-bar' ? 'bar' : 'area';
            return [
                { type: t, id: id0, xKey: 'timestamp', yKey: 'open', stacked: true, selection: { enabled: true } },
                { type: t, id: id1, xKey: 'timestamp', yKey: 'close', stacked: true, selection: { enabled: true } },
            ];
        }
        case 'range-area':
        case 'range-bar':
            return [
                {
                    type,
                    id: id0,
                    xKey: 'timestamp',
                    yLowKey: 'low',
                    yHighKey: 'high',
                    selection: { enabled: true },
                },
            ];
        case 'candlestick':
        case 'ohlc':
            return [
                {
                    type,
                    id: id0,
                    xKey: 'timestamp',
                    lowKey: 'low',
                    highKey: 'high',
                    openKey: 'open',
                    closeKey: 'close',
                    selection: {
                        enabled: true,
                        selectedItem: { fill: '#ff3b30', stroke: '#990000', strokeWidth: 2 },
                    },
                },
            ];
        case 'scatter':
            return [
                {
                    type,
                    id: id0,
                    xKey: 'x',
                    yKey: 'y',
                    fillOpacity: 0.2,
                    strokeOpacity: 0.2,
                    selection: {
                        enabled: true,
                        selectedItem: { fill: '#ff3b30', stroke: '#990000', strokeWidth: 2 },
                    },
                },
            ];
        case 'bubble':
            return [
                {
                    type,
                    id: id0,
                    xKey: 'x',
                    yKey: 'y',
                    sizeKey: 'size',
                    fillOpacity: 0.2,
                    strokeOpacity: 0.2,
                    selection: {
                        enabled: true,
                        selectedItem: { fill: '#ff3b30', stroke: '#990000', strokeWidth: 2 },
                    },
                },
            ];
        case 'histogram':
            return [{ type, id: id0, xKey: 'close', selection: { enabled: true } }];
    }
}

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: baseData,
    dataIdKey: 'timestamp',
    animation: { enabled: false },
    selection: {
        enabled: true,
        enableDrag: true,
    },
    zoom: {
        enabled: true,
        axes: 'xy',
        anchorPointX: 'pointer',
        anchorPointY: 'pointer',
        autoScaling: { enabled: true },
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

const numberAxes: Record<string, AgCartesianAxisOptions> = {
    x: { type: 'number' },
};

function applySeriesType(type: SeriesType) {
    options.series = buildSeries(type);
    if (type === 'bubble' || type === 'scatter' || type === 'histogram') {
        options.zoom!.axes = 'xy';
        options.zoom!.autoScaling!.enabled = false;
        options.navigator!.enabled = false;
        options.axes = numberAxes;
    } else {
        options.zoom!.axes = 'xy';
        options.zoom!.autoScaling!.enabled = true;
        options.navigator!.enabled = true;
        options.axes = timeAxes;
    }
}

/** inScope */
function* selectionItemsForFraction(fraction: number): Iterable<AgSelectionItemIds> {
    if (fraction <= 0) return;
    const seriesIds = (options.series ?? []).map((s) => (s as { id: string }).id);
    const data = options.data ?? [];
    if (seriesIds.length === 0 || data.length === 0) return;
    const stride = fraction >= 1 ? 1 : Math.max(1, Math.round(1 / fraction));
    for (let i = 0; i < data.length; i += stride) {
        const itemId = (data[i] as { timestamp: number }).timestamp;
        for (const seriesId of seriesIds) {
            yield { seriesId, itemId };
        }
    }
}

/** inScope */
async function setSelectionFraction(fraction: number): Promise<void> {
    if (!chartRef.current) return;
    if (fraction <= 0) {
        chartRef.current.clearSelection();
    } else {
        chartRef.current.setSelection(selectionItemsForFraction(fraction));
    }
    await chartRef.current.waitForUpdate();
}

/** inScope */
async function applySeriesAndUpdate(type: SeriesType): Promise<void> {
    applySeriesType(type);
    await chartRef.current!.update(options);
    await chartRef.current!.waitForUpdate();
}

// Referenced from index.html onchange
function setSeries(type: string) {
    void applySeriesAndUpdate(type as SeriesType);
}

/** inScope */
function getBenchmarkConfig(): BenchmarkConfig {
    const testCases = SERIES_TYPES.map((seriesType) => ({
        id: `${seriesType}`,
        label: seriesType,
        setup: () => applySeriesAndUpdate(seriesType),
        variants: [
            {
                params: { Selection: 'none' },
                run: async () => {
                    await setSelectionFraction(0);
                    return performZoom(options, chartRef, (opts) => AgCharts.create(opts), container, ZOOM_REPS);
                },
            },
            {
                params: { Selection: '50%' },
                run: async () => {
                    await setSelectionFraction(0.5);
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
        onComplete: async () => {
            await setSelectionFraction(0);
        },
    };
}

if (!window.location.hash.includes('e2e=true')) {
    initBenchmark(getBenchmarkConfig());
}
/* @ag-skip-clone */
