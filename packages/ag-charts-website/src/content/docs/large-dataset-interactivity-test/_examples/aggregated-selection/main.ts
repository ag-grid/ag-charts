import {
    AgCartesianAxisOptions,
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    AreaSeriesModule,
    BarSeriesModule,
    BubbleSeriesModule,
    CandlestickSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    HistogramSeriesModule,
    LegendModule,
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
    ZoomModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    AreaSeriesModule,
    BarSeriesModule,
    BubbleSeriesModule,
    CandlestickSeriesModule,
    CrosshairModule,
    HistogramSeriesModule,
    LegendModule,
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
    ContextMenuModule,
]);

let dataLabel = '1K';
let seriesType = 'Line';
let datapoints = 1e3;
let selectedCount = 0;

const timeAxes: Record<string, AgCartesianAxisOptions> = {
    x: { type: 'ordinal-time', parentLevel: { enabled: true } },
};

const numberAxes: Record<string, AgCartesianAxisOptions> = {
    x: { type: 'number' },
};

const baseData = getData(1e6);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: baseData.slice(-datapoints),
    title: { text: `${seriesType} with ${dataLabel} datapoints` },
    animation: { enabled: false },
    selection: {
        enabled: true,
        enableDrag: true,
    },
    zoom: {
        enabled: true,
        axes: 'x',
        anchorPointX: 'pointer',
        anchorPointY: 'pointer',
        autoScaling: {
            enabled: true,
        },
    },
    navigator: {
        enabled: true,
        miniChart: {
            enabled: true,
        },
    },
    listeners: {
        selectionChange: (ev) => {
            selectedCount += ev.added.length - ev.removed.length;
            const el = document.getElementById('selected-count');
            if (el) {
                el.textContent = String(selectedCount);
            }
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'timestamp',
            yKey: 'close',
            selection: { enabled: true },
        },
    ],
    axes: timeAxes,
};

const chart = AgCharts.create(options);

function setSeries(type: string, label: string) {
    seriesType = label;
    switch (type) {
        case 'bar':
        case 'area':
        case 'line':
            options.series = [
                {
                    type,
                    xKey: 'timestamp',
                    yKey: 'high',
                    selection: { enabled: true },
                },
            ];
            break;
        case 'stacked-bar':
        case 'stacked-area':
            const stackedType = type === 'stacked-bar' ? 'bar' : 'area';
            options.series = [
                {
                    type: stackedType,
                    xKey: 'timestamp',
                    yKey: 'open',
                    stacked: true,
                    selection: { enabled: true },
                },
                {
                    type: stackedType,
                    xKey: 'timestamp',
                    yKey: 'close',
                    stacked: true,
                    selection: { enabled: true },
                },
            ];
            break;

        case 'range-area':
        case 'range-bar':
            options.series = [
                {
                    type,
                    xKey: 'timestamp',
                    yLowKey: 'low',
                    yHighKey: 'high',
                    selection: { enabled: true },
                },
            ];
            break;
        case 'candlestick':
        case 'ohlc':
            options.series = [
                {
                    type,
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
            break;
        case 'scatter':
            options.series = [
                {
                    type,
                    xKey: 'x',
                    yKey: 'y',
                    fillOpacity: 0.2,
                    strokeOpacity: 0.2,
                    selection: {
                        enabled: true,
                        selectedItem: { fill: '#ff3b30', stroke: '#990000', strokeWidth: 2 },
                    },
                    itemStyler: (params: { selectionState?: string }) =>
                        params.selectionState === 'selected' ? { size: 12 } : {},
                },
            ];
            break;
        case 'bubble':
            options.series = [
                {
                    type,
                    xKey: 'x',
                    yKey: 'y',
                    sizeKey: 'size',
                    fillOpacity: 0.2,
                    strokeOpacity: 0.2,
                    selection: {
                        enabled: true,
                        selectedItem: { fill: '#ff3b30', stroke: '#990000', strokeWidth: 2 },
                    },
                    itemStyler: (params: { size: number; selectionState?: string }) =>
                        params.selectionState === 'selected' ? { size: params.size * 1.6 } : {},
                },
            ];
            break;
        case 'histogram':
            options.series = [
                {
                    type,
                    xKey: 'close',
                },
            ];
            break;
        default:
            return;
    }

    const newDatapoints = (options.series?.[0] as any)?.stacked ? datapoints / 2 : datapoints;
    if (options.data?.length !== newDatapoints) {
        options.data = baseData.slice(-newDatapoints);
    }
    if (type == 'bubble' || type == 'scatter' || type == 'histogram') {
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

    options.title!.text = `${seriesType} with ${dataLabel} datapoints`;
    chart.update(options);
}

function setData(points: number, label: string) {
    const newDatapoints = (options.series?.[0] as any)?.stacked ? points / 2 : points;
    if (options.data?.length !== newDatapoints) {
        options.data = baseData.slice(-newDatapoints);
    }
    dataLabel = label;
    datapoints = points;
    options.title!.text = `${seriesType} with ${dataLabel} datapoints`;
    chart.update(options);
}
/* @ag-skip-clone */
