import { AgCartesianChartOptions, AgChartLegendPosition, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: { text: 'Change in Energy Sources' },
    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'naturalGas',
            yName: 'Natural gas',
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'coal',
            yName: 'Coal',
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'primaryOil',
            yName: 'Primary oil',
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'petroleum',
            yName: 'Petroleum',
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'manufacturedFuels',
            yName: 'Manufactured fuels',
        },
    ],
    legend: {
        item: {
            showSeriesStroke: false,
            label: {
                fontSize: 14,
                fontStyle: 'italic',
                fontWeight: 'bold',
                fontFamily: 'Papyrus',
                color: 'red',
                maxLength: 12,
                formatter: ({ value }) => (value == 'Coal' ? value + ' *' : value),
            },
            marker: {
                size: 20,
                strokeWidth: 3,
                shape: 'diamond', // 'circle', 'square', 'cross', 'plus', 'triangle'
            },
            line: {
                strokeWidth: 4,
                length: 40, //20 for the marker and 10 on each side
            },
        },
    },
};

const chart = AgCharts.create(options);
