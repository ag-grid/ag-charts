import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Vehicle Fuel Efficiency',
        fontSize: 18,
    },
    subtitle: {
        text: 'USA 1987',
    },
    series: [
        {
            type: 'histogram',
            xKey: 'engine-size',
            xName: 'Engine Size',
            yKey: 'highway-mpg',
            yName: 'Highway MPG',
            aggregation: 'mean',
            strokeWidth: 2,
            strokeOpacity: 0,
        },
        {
            type: 'scatter',
            xKey: 'engine-size',
            xName: 'Engine Size',
            yKey: 'highway-mpg',
            yName: 'Highway MPG',
            marker: {
                strokeWidth: 0,
                fillOpacity: 1,
            },
        },
    ],
    axes: [
        {
            position: 'bottom',
            type: 'number',
            nice: false,
            gridLine: {
                style: [
                    {
                        stroke: 'rgb(216,216,216)',
                        lineDash: [2],
                    },
                ],
            },
            title: {
                enabled: true,
                text: 'Engine Size',
            },
            crosshair: {
                enabled: false,
            },
        },
        {
            position: 'left',
            type: 'number',
            nice: false,
            gridLine: {
                style: [
                    {
                        stroke: 'rgb(216,216,216)',
                        lineDash: [2],
                    },
                ],
            },
            label: {
                enabled: false,
            },
            crosshair: {
                enabled: false,
            },
        },
    ],
    legend: {
        enabled: false,
    },
};

AgCharts.create(options);
