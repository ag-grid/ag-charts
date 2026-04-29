// @ag-skip-fws
import {
    AgCharts,
    AnimationModule,
    AreaSeriesModule,
    BarSeriesModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NavigatorModule,
    NumberAxisModule,
    RangeAreaSeriesModule,
    RangeBarSeriesModule,
    SelectionModule,
} from 'ag-charts-enterprise';
import {
    AgAreaSeriesOptions,
    AgBarSeriesOptions,
    AgCartesianChartOptions,
    AgLineSeriesOptions,
    AgRangeAreaSeriesOptions,
    AgRangeBarSeriesOptions,
    AgSeriesMarkerStyle,
    SelectionState,
    StrokeOptions,
} from 'ag-charts-types';

import type { DataType } from './data';
import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    AreaSeriesModule,
    BarSeriesModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    NavigatorModule,
    NumberAxisModule,
    RangeAreaSeriesModule,
    RangeBarSeriesModule,
    SelectionModule,
]);

const barItemStyler = (params: { selectionState?: SelectionState }): StrokeOptions | undefined => {
    if (params.selectionState === 'selected') {
        return { stroke: 'red' };
    }
};

const markerItemStyler = (params: { selectionState?: SelectionState }): AgSeriesMarkerStyle | undefined => {
    if (params.selectionState === 'selected') {
        return { size: 15 };
    }
};
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    selection: {
        enabled: true,
        enableClick: true,
        enableDrag: true,
    },
    tooltip: {
        enabled: false,
    },
    axes: {
        y: {
            type: 'number',
            interval: {
                minSpacing: 80,
                maxSpacing: 120,
            },
        },
        x: {
            type: 'number',
            nice: false,
            interval: {
                minSpacing: 80,
                maxSpacing: 120,
            },
            label: {
                autoRotate: false,
            },
        },
    },
    navigator: {
        enabled: true,
    },
    listeners: {
        selectionChange: (ev: unknown) => {
            console.log(ev);
        },
    },
    data: getData(),
    series: getAreaSeriesOptions(),
};

const chart = AgCharts.create(options);

function getAreaSeriesOptions(): AgAreaSeriesOptions<DataType>[] {
    return [
        {
            type: 'area',
            xKey: 'year',
            yKey: 'low',
            marker: { itemStyler: markerItemStyler },
        },
    ];
}

function getBarSeriesOptions(): AgBarSeriesOptions<DataType>[] {
    return [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'low',
            itemStyler: barItemStyler,
        },
    ];
}

function getLineSeriesOptions(): AgLineSeriesOptions<DataType>[] {
    return [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'low',
            marker: { itemStyler: markerItemStyler },
        },
    ];
}

function getRangeAreaSeriesOptions(): AgRangeAreaSeriesOptions<DataType>[] {
    return [
        {
            type: 'range-area',
            xKey: 'year',
            yLowKey: 'low',
            yHighKey: 'high',
            marker: { itemStyler: markerItemStyler },
        },
    ];
}

function getRangeBarSeriesOptions(): AgRangeBarSeriesOptions<DataType>[] {
    return [
        {
            type: 'range-bar',
            xKey: 'year',
            yLowKey: 'low',
            yHighKey: 'high',
            itemStyler: barItemStyler,
        },
    ];
}

export function onChartTypeChange(value: unknown) {
    switch (value) {
        case 'area':
            options.series = getAreaSeriesOptions();
            break;

        case 'bar':
            options.series = getBarSeriesOptions();
            break;

        case 'line':
            options.series = getLineSeriesOptions();
            break;

        case 'range-area':
            options.series = getRangeAreaSeriesOptions();
            break;

        case 'range-bar':
            options.series = getRangeBarSeriesOptions();
            break;

        default:
            console.error(`unexpected value:`, value);
            throw new Error();
    }

    chart.update(options);
}
