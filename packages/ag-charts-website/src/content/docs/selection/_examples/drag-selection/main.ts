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

function initMyDragBox() {
    const elem = document.getElementById('myDragBox')!;
    if (elem == null) return -1;

    let downX = NaN;
    let downY = NaN;
    function toStartAndLength(start: number, end: number): [`${number}px`, `${number}px`] {
        if (start > end) {
            [start, end] = [end, start];
        }
        return [`${start}px`, `${end - start}px`];
    }
    function updateBounds(ev: { clientX: number; clientY: number }) {
        const [left, width] = toStartAndLength(downX, ev.clientX);
        const [top, height] = toStartAndLength(downY, ev.clientY);
        elem.style.left = left;
        elem.style.top = top;
        elem.style.width = width;
        elem.style.height = height;
    }

    window.addEventListener(
        'mousedown',
        (ev) => {
            if (ev.button !== 0) return;
            downX = ev.clientX;
            downY = ev.clientY;
            updateBounds(ev);
            elem.style.display = 'block';
        },
        { capture: true }
    );
    window.addEventListener(
        'mousemove',
        (ev) => {
            if (ev.button !== 0) return;
            updateBounds(ev);
        },
        { capture: true }
    );
    window.addEventListener(
        'mouseup',
        (ev) => {
            if (ev.button !== 0) return;
            elem.style.display = 'none';
        },
        { capture: true }
    );
    return 0;
}
initMyDragBox();

const barItemStyler = (params: { selectionState?: SelectionState }): StrokeOptions => {
    if (params.selectionState === 'selected') {
        return { stroke: 'black', strokeWidth: 2 };
    }
};

const markerItemStyler = (params: { selectionState?: SelectionState }): AgSeriesMarkerStyle => {
    if (params.selectionState === 'selected') {
        return { stroke: 'black', strokeWidth: 2, size: 15 };
    }
};
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    selection: {
        enabled: true,
        enableClick: true,
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
