import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Vehicle Fuel Efficiency',
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
            cornerRadius: 6,
        },
        {
            type: 'scatter',
            xKey: 'engine-size',
            xName: 'Engine Size',
            yKey: 'highway-mpg',
            yName: 'Highway MPG',
            strokeWidth: 0,
            fillOpacity: 1,
        },
    ],
    axes: {
        x: {
            position: 'bottom',
            type: 'number',
            nice: false,
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
            title: {
                enabled: true,
                text: 'Engine Size',
            },
        },
        y: {
            position: 'left',
            type: 'number',
            nice: false,
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
            thickness: 30,
            label: {
                enabled: false,
            },
        },
    },
    legend: {
        enabled: false,
    },
};

AgCharts.create(options);
