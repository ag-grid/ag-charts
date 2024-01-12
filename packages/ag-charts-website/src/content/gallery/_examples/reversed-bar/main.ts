import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: "Apple's Revenue by Product Category",
    },
    subtitle: {
        text: 'In Billion U.S. Dollars',
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'mac',
            yName: 'Mac',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'ipad',
            yName: 'iPad',
            fillOpacity: 0.6,
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'wearables',
            yName: 'Wearables',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'services',
            yName: 'Services',
            fillOpacity: 0.6,
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'top',
            line: {
                enabled: false,
            },
            gridLine: {
                enabled: true,
            },
        },
        {
            type: 'number',
            position: 'left',
            reverse: true,
            tick: {
                interval: 40,
            },
        },
    ],
};

AgCharts.create(options);
