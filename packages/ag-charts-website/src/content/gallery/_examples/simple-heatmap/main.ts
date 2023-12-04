import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'UK monthly mean temperature °C',
    },
    series: [
        {
            type: 'heatmap',

            xKey: 'month',
            xName: 'Month',

            yKey: 'year',
            yName: 'Year',

            colorKey: 'temperature',
            colorName: 'Temperature',
        },
    ],
    axes: [
        {
            position: 'left',
            type: 'category',
            label: {
                enabled: false,
            },
            line: {
                enabled: false,
            },
        },
        {
            position: 'bottom',
            type: 'category',
            line: {
                enabled: false,
            },
        },
    ],
};

AgCharts.create(options);
