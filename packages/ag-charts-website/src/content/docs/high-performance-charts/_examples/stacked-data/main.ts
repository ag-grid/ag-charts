import {
    AgCartesianAxisOptions,
    AgCartesianChartOptions,
    AgCartesianSeriesOptions,
    AgCharts,
} from 'ag-charts-enterprise';

import { getData } from './data';

// @ts-expect-error Undocumented option
window.agChartsDebug = 'scene:stats';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(1e4),
    animation: { enabled: false },
    zoom: {
        enabled: true,
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
    series: [
        {
            type: 'area',
            xKey: 'timestamp',
            yKey: 'petrol',
            marker: { enabled: false },
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'timestamp',
            yKey: 'diesel',
            marker: { enabled: false },
            stacked: true,
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
        },
        {
            type: 'ordinal-time',
            position: 'bottom',
            parentLevel: { enabled: true },
        },
    ],
};

const chart = AgCharts.create(options);

function setSeries(type: string) {
    let series: AgCartesianSeriesOptions[];
    switch (type) {
        case 'bar':
            series = [
                {
                    type: 'bar',
                    xKey: 'timestamp',
                    yKey: 'petrol',
                    stacked: true,
                },
                {
                    type: 'bar',
                    xKey: 'timestamp',
                    yKey: 'diesel',
                    stacked: true,
                },
            ];
            break;
        case 'area':
        case 'line':
            series = [
                {
                    type: type,
                    xKey: 'timestamp',
                    yKey: 'petrol',
                    marker: { enabled: false },
                    stacked: true,
                },
                {
                    type: type,
                    xKey: 'timestamp',
                    yKey: 'diesel',
                    marker: { enabled: false },
                    stacked: true,
                },
            ];
            break;
        default:
            return;
    }

    options.series = series;
    chart.update(options);
}

function setAxes(type: string) {
    let axis: AgCartesianAxisOptions;
    switch (type) {
        case 'time':
            axis = {
                type,
                position: 'bottom',
                nice: false,
            };
            break;
        case 'ordinal-time':
        case 'unit-time':
            axis = {
                type,
                position: 'bottom',
            };
            break;
        case 'ordinal-time-parent':
            axis = {
                type: 'ordinal-time',
                position: 'bottom',
                parentLevel: { enabled: true },
            };
            break;
        default:
            return;
    }

    options.axes = [{ type: 'number', position: 'left' }, axis];
    chart.update(options);
}

function setData(points: number) {
    options.data = getData(points);
    chart.update(options);
}
