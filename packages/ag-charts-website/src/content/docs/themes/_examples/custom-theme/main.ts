import { AgChartOptions, AgChartTheme, AgCharts } from 'ag-charts-community';

import { getData } from './data';

var myTheme: AgChartTheme = {
    palette: {
        fills: ['#5C2983', '#0076C5', '#21B372', '#FDDE02', '#F76700', '#D30018'],
        strokes: ['black'],
    },
    overrides: {
        common: {
            title: {
                fontSize: 24,
            },
        },
        bar: {
            series: {
                label: {
                    enabled: true,
                    color: 'black',
                },
                strokeWidth: 1,
            },
        },
    },
};

const options: AgChartOptions = {
    theme: myTheme,
    container: document.getElementById('myChart'),
    title: {
        text: 'Custom Chart Theme Example',
    },
    data: getData(),
    series: [
        { type: 'bar', xKey: 'label', yKey: 'v1', stacked: true, yName: 'Reliability' },
        { type: 'bar', xKey: 'label', yKey: 'v2', stacked: true, yName: 'Ease of use' },
        { type: 'bar', xKey: 'label', yKey: 'v3', stacked: true, yName: 'Performance' },
        { type: 'bar', xKey: 'label', yKey: 'v4', stacked: true, yName: 'Price' },
        { type: 'bar', xKey: 'label', yKey: 'v5', stacked: true, yName: 'Market share' },
    ],
};

const chart = AgCharts.create(options);
