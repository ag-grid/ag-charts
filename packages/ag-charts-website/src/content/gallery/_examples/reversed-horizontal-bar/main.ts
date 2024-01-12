import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'MacBook Sales',
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
            yKey: 'sales',
            yName: 'Sales',
            label: {
                formatter: ({ value }) => `$${value.toFixed(0)}B`,
            },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'left',
            paddingInner: 0.4,
            paddingOuter: 0.5,
            groupPaddingInner: 0,
            line: {
                enabled: false,
            },
            gridLine: {
                enabled: true,
            },
            tick: {
                enabled: true,
            },
        },
        {
            type: 'number',
            position: 'bottom',
            reverse: true,
            tick: {
                enabled: true,
            },
        },
    ],
};

AgCharts.create(options);
