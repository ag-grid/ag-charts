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
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'iphone',
            yName: 'iPhone',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'mac',
            yName: 'Mac',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'ipad',
            yName: 'iPad',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'wearables',
            yName: 'Wearables',
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'services',
            yName: 'Services',
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'left',
            line: {
                enabled: false,
            },
        },
        {
            type: 'number',
            position: 'bottom',
            reverse: true,
            interval: { step: 60 },
        },
    ],
};

AgCharts.create(options);
