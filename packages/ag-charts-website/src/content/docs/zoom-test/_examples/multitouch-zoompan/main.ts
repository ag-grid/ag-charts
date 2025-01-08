import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    zoom: { enabled: true },
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'women',
            yName: 'Women',
            marker: { size: 20 },
            tooltip: { enabled: true },
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'men',
            yName: 'Men',
            marker: { size: 20 },
            tooltip: { enabled: true },
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'portions',
            yName: 'Portions',
            marker: { size: 20 },
            tooltip: { enabled: true },
        },
    ],
    legend: { enabled: false },
    background: { fill: 'rgb(0, 255, 0)' },
    axes: [
        {
            position: 'bottom',
            type: 'category',
            title: { enabled: false },
            crossLines: [
                {
                    type: 'range',
                    fill: 'red',
                    fillOpacity: 0.2,
                    range: ['2005', '2007'],
                },
                {
                    type: 'range',
                    fill: 'blue',
                    fillOpacity: 0.2,
                    range: ['2013', '2015'],
                },
            ],
        },
        {
            position: 'left',
            type: 'number',
            title: { enabled: false },
            crossLines: [
                {
                    type: 'line',
                    stroke: 'red',
                    strokeWidth: 3,
                    value: 11,
                },
                {
                    type: 'line',
                    stroke: 'blue',
                    strokeWidth: 3,
                    value: 15,
                },
            ],
        },
    ],
};

const chart = AgCharts.create(options);
