// @ag-skip-fws
import {
    AgCartesianAxesOptions,
    AgCartesianAxisOptions,
    AgCartesianSeriesOptions,
    AgChartOptions,
    AgCharts,
    AgPolarSeriesOptions,
    AngleCategoryAxisModule,
    AngleNumberAxisModule,
    AnimationModule,
    AreaSeriesModule,
    BarSeriesModule,
    BoxPlotSeriesModule,
    BubbleSeriesModule,
    CandlestickSeriesModule,
    CategoryAxisModule,
    FunnelSeriesModule,
    HeatmapSeriesModule,
    HistogramSeriesModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NightingaleSeriesModule,
    NumberAxisModule,
    OhlcSeriesModule,
    PyramidSeriesModule,
    RadialBarSeriesModule,
    RadialColumnSeriesModule,
    RadiusCategoryAxisModule,
    RadiusNumberAxisModule,
    RangeAreaSeriesModule,
    RangeBarSeriesModule,
    ScatterSeriesModule,
    TimeAxisModule,
    UnitTimeAxisModule,
    WaterfallSeriesModule,
} from 'ag-charts-enterprise';

import type { DataMode } from './data';
import { getData } from './data';

ModuleRegistry.registerModules([
    AngleCategoryAxisModule,
    AngleNumberAxisModule,
    AnimationModule,
    AreaSeriesModule,
    BarSeriesModule,
    BoxPlotSeriesModule,
    BubbleSeriesModule,
    CandlestickSeriesModule,
    CategoryAxisModule,
    FunnelSeriesModule,
    HeatmapSeriesModule,
    HistogramSeriesModule,
    LegendModule,
    LineSeriesModule,
    NightingaleSeriesModule,
    NumberAxisModule,
    OhlcSeriesModule,
    PyramidSeriesModule,
    RadialBarSeriesModule,
    RadialColumnSeriesModule,
    RadiusCategoryAxisModule,
    RadiusNumberAxisModule,
    RangeAreaSeriesModule,
    RangeBarSeriesModule,
    ScatterSeriesModule,
    TimeAxisModule,
    UnitTimeAxisModule,
    WaterfallSeriesModule,
]);

type SeriesType =
    | 'bar'
    | 'line'
    | 'area'
    | 'scatter'
    | 'bubble'
    | 'histogram'
    | 'range-bar'
    | 'range-area'
    | 'box-plot'
    | 'waterfall'
    | 'ohlc'
    | 'candlestick'
    | 'radial-bar'
    | 'radial-column'
    | 'nightingale'
    | 'pyramid'
    | 'funnel'
    | 'heatmap';

type Stacking = 'none' | 'stacked' | 'grouped' | 'normalized';

// Series with no value-based x axis (polar, pyramid) or a categorical one (heatmap); these fall
// back to bigint data when ISO datetime is selected.
const NON_TIME_SERIES: ReadonlySet<SeriesType> = new Set<SeriesType>([
    'radial-bar',
    'radial-column',
    'nightingale',
    'pyramid',
    'funnel',
    'heatmap',
]);

// Histogram bins a numeric x axis, so ISO strings are not applicable; it falls
// back to bigint data when ISO datetime is selected.
const NUMERIC_X_ONLY_SERIES: ReadonlySet<SeriesType> = new Set<SeriesType>(['histogram']);

// Cartesian series that place discrete bars/candles on the x axis use unit-time
// in ISO mode; continuous series (line/area/scatter/bubble) use a plain time axis.
const UNIT_TIME_SERIES: ReadonlySet<SeriesType> = new Set<SeriesType>([
    'bar',
    'range-bar',
    'box-plot',
    'waterfall',
    'ohlc',
    'candlestick',
]);

const GROUPABLE_SERIES: ReadonlySet<SeriesType> = new Set<SeriesType>(['radial-bar', 'radial-column']);

let seriesType: SeriesType = 'bar';
let dataMode: DataMode = 'bigint-small';
let stacking: Stacking = 'none';

function effectiveDataMode(): DataMode {
    if (dataMode === 'iso-datetime' && (NON_TIME_SERIES.has(seriesType) || NUMERIC_X_ONLY_SERIES.has(seriesType))) {
        return 'bigint-small';
    }
    return dataMode;
}

function isTimeMode(): boolean {
    return effectiveDataMode() === 'iso-datetime';
}

function valueXAxis(): AgCartesianAxisOptions {
    if (isTimeMode()) {
        return { type: UNIT_TIME_SERIES.has(seriesType) ? 'unit-time' : 'time', position: 'bottom' };
    }
    return { type: 'number', position: 'bottom', nice: false };
}

// Returns undefined for funnel, which manages its own axes internally.
function cartesianAxes(): AgCartesianAxesOptions | undefined {
    if (seriesType === 'histogram') {
        return { x: { type: 'number', position: 'bottom' }, y: { type: 'number', position: 'left' } };
    }
    if (seriesType === 'heatmap') {
        return { x: { type: 'category', position: 'bottom' }, y: { type: 'category', position: 'left' } };
    }
    if (seriesType === 'funnel') {
        return undefined;
    }
    return { x: valueXAxis(), y: { type: 'number', position: 'left' } };
}

function buildCartesianSeries(): AgCartesianSeriesOptions[] {
    const x = 'x';
    const stacked = stacking === 'stacked' || stacking === 'normalized';
    const grouped = stacking === 'grouped';
    const normalizedTo = stacking === 'normalized' ? 100 : undefined;

    switch (seriesType) {
        case 'bar':
            return [
                { type: 'bar', xKey: x, yKey: 'open', yName: 'Open', stacked, grouped, normalizedTo },
                { type: 'bar', xKey: x, yKey: 'close', yName: 'Close', stacked, grouped, normalizedTo },
            ];
        case 'line':
            return [{ type: 'line', xKey: x, yKey: 'close', yName: 'Close', marker: { enabled: true } }];
        case 'area':
            return [
                { type: 'area', xKey: x, yKey: 'open', yName: 'Open', stacked, normalizedTo },
                { type: 'area', xKey: x, yKey: 'close', yName: 'Close', stacked, normalizedTo },
            ];
        case 'scatter':
            return [{ type: 'scatter', xKey: x, yKey: 'close', yName: 'Close' }];
        case 'bubble':
            return [{ type: 'bubble', xKey: x, yKey: 'close', sizeKey: 'size', yName: 'Close' }];
        case 'histogram':
            return [{ type: 'histogram', xKey: x, yKey: 'value', yName: 'Value', aggregation: 'sum' }];
        case 'range-bar':
            return [{ type: 'range-bar', xKey: x, yLowKey: 'low', yHighKey: 'high', yName: 'Range' }];
        case 'range-area':
            return [{ type: 'range-area', xKey: x, yLowKey: 'low', yHighKey: 'high', yName: 'Range' }];
        case 'box-plot':
            return [
                {
                    type: 'box-plot',
                    xKey: x,
                    minKey: 'low',
                    q1Key: 'open',
                    medianKey: 'value',
                    q3Key: 'close',
                    maxKey: 'high',
                },
            ];
        case 'waterfall':
            return [{ type: 'waterfall', xKey: x, yKey: 'close', yName: 'Close' }];
        case 'ohlc':
            return [{ type: 'ohlc', xKey: x, openKey: 'open', highKey: 'high', lowKey: 'low', closeKey: 'close' }];
        case 'candlestick':
            return [
                { type: 'candlestick', xKey: x, openKey: 'open', highKey: 'high', lowKey: 'low', closeKey: 'close' },
            ];
        case 'heatmap':
            return [{ type: 'heatmap', xKey: 'category', yKey: 'category', colorKey: 'value', colorName: 'Value' }];
        case 'funnel':
            return [{ type: 'funnel', stageKey: 'category', valueKey: 'value' }];
        default:
            return [];
    }
}

function isRadial(): boolean {
    return seriesType === 'radial-bar' || seriesType === 'radial-column' || seriesType === 'nightingale';
}

function buildRadialSeries(): AgPolarSeriesOptions[] {
    const stacked = stacking === 'stacked' || stacking === 'normalized';
    const grouped = stacking === 'grouped' && GROUPABLE_SERIES.has(seriesType);
    const normalizedTo = stacking === 'normalized' ? 100 : undefined;

    if (seriesType === 'nightingale') {
        return [
            {
                type: 'nightingale',
                angleKey: 'category',
                radiusKey: 'close',
                radiusName: 'Close',
                stacked,
                normalizedTo,
            },
        ];
    }
    if (seriesType === 'radial-bar') {
        // radial-bar reverses the axis roles vs radial-column: the value lives on the angle axis and the
        // category on the radius axis, so the bigint/large-magnitude exercise runs on the angle axis here.
        return [
            {
                type: 'radial-bar',
                radiusKey: 'category',
                angleKey: 'open',
                angleName: 'Open',
                stacked,
                grouped,
                normalizedTo,
            },
            {
                type: 'radial-bar',
                radiusKey: 'category',
                angleKey: 'close',
                angleName: 'Close',
                stacked,
                grouped,
                normalizedTo,
            },
        ];
    }
    return [
        {
            type: 'radial-column',
            angleKey: 'category',
            radiusKey: 'open',
            radiusName: 'Open',
            stacked,
            grouped,
            normalizedTo,
        },
        {
            type: 'radial-column',
            angleKey: 'category',
            radiusKey: 'close',
            radiusName: 'Close',
            stacked,
            grouped,
            normalizedTo,
        },
    ];
}

// A concrete initial-state literal (bar + bigint-small + no stacking) so the example tooling can
// statically extract the options; the controls below mutate it for every series/data/stacking choice.
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData('bigint-small'),
    axes: {
        x: { type: 'number', position: 'bottom', nice: false },
        y: { type: 'number', position: 'left' },
    },
    series: [
        { type: 'bar', xKey: 'x', yKey: 'open', yName: 'Open' },
        { type: 'bar', xKey: 'x', yKey: 'close', yName: 'Close' },
    ],
};

// Pin the instance to the full options union: the switcher updates the chart across
// chart families (cartesian/polar/standalone), so update() must accept any AgChartOptions.
const chart = AgCharts.create<AgChartOptions>(options);

// `options` is a chart-options union; the switcher reassigns series/axes/data across chart families, so
// it is mutated through a loose view rather than re-declaring a typed literal per branch.
const mutableOptions = options as { data: unknown[]; series: unknown; axes?: unknown };

function applyState() {
    mutableOptions.data = getData(effectiveDataMode());
    if (isRadial()) {
        mutableOptions.series = buildRadialSeries();
        // radial-bar carries the value on the angle axis and the category on the radius axis; the
        // radial-column / nightingale family is the other way round.
        mutableOptions.axes =
            seriesType === 'radial-bar'
                ? { angle: { type: 'angle-number' }, radius: { type: 'radius-category' } }
                : { angle: { type: 'angle-category' }, radius: { type: 'radius-number' } };
    } else if (seriesType === 'pyramid') {
        mutableOptions.series = [{ type: 'pyramid', stageKey: 'category', valueKey: 'value' }];
        delete mutableOptions.axes;
    } else {
        mutableOptions.series = buildCartesianSeries();
        const axes = cartesianAxes();
        if (axes) {
            mutableOptions.axes = axes;
        } else {
            delete mutableOptions.axes;
        }
    }
    chart.update(options);
}

export function onSeriesChange(value: string) {
    seriesType = value as SeriesType;
    applyState();
}

export function onDataModeChange(value: string) {
    dataMode = value as DataMode;
    applyState();
}

export function onStackingChange(value: string) {
    stacking = value as Stacking;
    applyState();
}
