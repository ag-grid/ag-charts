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
    ZoomModule,
} from 'ag-charts-enterprise';
import {
    AgAreaSeriesOptions,
    AgBarSeriesOptions,
    AgCartesianChartOptions,
    AgLineSeriesOptions,
    AgRangeAreaSeriesOptions,
    AgRangeBarSeriesOptions,
    AgSelectionItemIds,
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
    ZoomModule,
]);

let savedSelection: AgSelectionItemIds[] = [];

const fullData = getData();

function getDataAB() {
    return fullData.map((datum: DataType) => {
        const { year, a_low, a_high, b_low, b_high } = datum;
        return { year, a_low, a_high, b_low, b_high };
    });
}

function getDataC() {
    return fullData.map((datum: DataType) => {
        const { year, c_low: low, c_high: high } = datum;
        return { year, low, high };
    });
}

function getDataD() {
    return fullData.map((datum: DataType) => {
        const { year, d_low: low, d_high: high } = datum;
        return { year, low, high };
    });
}

const barItemStyler = (params: { selectionState?: SelectionState }): StrokeOptions | undefined => {
    if (params.selectionState === 'selected') {
        return { stroke: 'black', strokeWidth: 2 };
    }
};

const markerItemStyler = (params: { selectionState?: SelectionState }): AgSeriesMarkerStyle | undefined => {
    if (params.selectionState === 'selected') {
        return { stroke: 'black', strokeWidth: 2, size: 15 };
    }
};
const options: AgCartesianChartOptions<unknown> = {
    container: document.getElementById('myChart'),
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
    selection: undefined,
    navigator: {
        enabled: true,
    },
    zoom: {
        enableAxisDragging: false,
        enableAxisScrolling: false,
        enableDoubleClickToReset: false,
        enablePanning: false,
        enableScrolling: false,
        enableSelecting: false,
        enableTwoFingerZoom: false,
        onDataChange: {
            strategy: 'preserveRatios',
        },
    },
    listeners: {
        selectionChange: (ev: unknown) => {
            console.log(ev);
        },
    },
    data: getDataAB(),
    series: getAreaSeriesOptions(),
};

const chart = AgCharts.create(options);

function getAreaSeriesOptions(): AgAreaSeriesOptions<unknown>[] {
    return [
        {
            type: 'area',
            xKey: 'year',
            yKey: 'a_low',
            marker: { itemStyler: markerItemStyler },
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'b_low',
            marker: { itemStyler: markerItemStyler },
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'low',
            yName: 'c_low',
            marker: { itemStyler: markerItemStyler },
            data: getDataC(),
        },
        {
            type: 'area',
            xKey: 'year',
            yKey: 'low',
            yName: 'd_low',
            marker: { itemStyler: markerItemStyler },
            data: getDataD(),
        },
    ];
}

function getBarSeriesOptions(): AgBarSeriesOptions<unknown>[] {
    return [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'a_low',
            itemStyler: barItemStyler,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'b_low',
            itemStyler: barItemStyler,
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'low',
            yName: 'c_low',
            itemStyler: barItemStyler,
            data: getDataC(),
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'low',
            yName: 'd_low',
            itemStyler: barItemStyler,
            data: getDataD(),
        },
    ];
}

function getLineSeriesOptions(): AgLineSeriesOptions<unknown>[] {
    return [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'a_low',
            marker: { itemStyler: markerItemStyler },
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'b_low',
            marker: { itemStyler: markerItemStyler },
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'low',
            yName: 'c_low',
            marker: { itemStyler: markerItemStyler },
            data: getDataC(),
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'low',
            yName: 'd_low',
            marker: { itemStyler: markerItemStyler },
            data: getDataD(),
        },
    ];
}

function getRangeAreaSeriesOptions(): AgRangeAreaSeriesOptions<unknown>[] {
    return [
        {
            type: 'range-area',
            xKey: 'year',
            yLowKey: 'a_low',
            yHighKey: 'a_high',
            marker: { itemStyler: markerItemStyler },
        },
        {
            type: 'range-area',
            xKey: 'year',
            yLowKey: 'b_low',
            yHighKey: 'b_high',
            marker: { itemStyler: markerItemStyler },
        },
        {
            type: 'range-area',
            xKey: 'year',
            yLowKey: 'low',
            yLowName: 'c_low',
            yHighKey: 'high',
            yHighName: 'c_high',
            marker: { itemStyler: markerItemStyler },
            data: getDataC(),
        },
        {
            type: 'range-area',
            xKey: 'year',
            yLowKey: 'low',
            yLowName: 'd_low',
            yHighKey: 'high',
            yHighName: 'd_high',
            marker: { itemStyler: markerItemStyler },
            data: getDataD(),
        },
    ];
}

function getRangeBarSeriesOptions(): AgRangeBarSeriesOptions<unknown>[] {
    return [
        {
            type: 'range-bar',
            xKey: 'year',
            yLowKey: 'a_low',
            yHighKey: 'a_high',
            itemStyler: barItemStyler,
        },
        {
            type: 'range-bar',
            xKey: 'year',
            yLowKey: 'b_low',
            yHighKey: 'b_high',
            itemStyler: barItemStyler,
        },
        {
            type: 'range-bar',
            xKey: 'year',
            yLowKey: 'low',
            yLowName: 'c_low',
            yHighKey: 'high',
            yHighName: 'c_high',
            itemStyler: barItemStyler,
            data: getDataC(),
        },
        {
            type: 'range-bar',
            xKey: 'year',
            yLowKey: 'low',
            yLowName: 'd_low',
            yHighKey: 'high',
            yHighName: 'd_high',
            itemStyler: barItemStyler,
            data: getDataD(),
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

export function onSave() {
    savedSelection = Array.from(chart.getSelection());
}

export function onGet() {
    console.log(Array.from(chart.getSelection()));
}

export function onSet() {
    chart.setSelection(savedSelection);
}

export function onClear() {
    chart.clearSelection();
}

export function onSelectionChange(target: HTMLInputElement) {
    target.removeAttribute('checked');
    options.selection = {
        enabled: target.checked,
        enableClick: true,
        enableDrag: true,
    };
    chart.update(options);
}

export function onSeriesSelectionChange(target: HTMLInputElement) {
    target.removeAttribute('checked');
    const i: number = {
        mySelectionChangeA: 0,
        mySelectionChangeB: 1,
        mySelectionChangeC: 2,
        mySelectionChangeD: 3,
    }[target.id]!;
    options.series![i]!.selection = { enabled: target.checked };
    chart.update(options);
}
