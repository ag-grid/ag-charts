import { AgChart, AgChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Range Column',
    },
    series: [
        {
            type: 'range-bar',
            xKey: 'date',
            xName: 'Date',
            yLowKey: 'low',
            yHighKey: 'high',
            label: {
                formatter: ({ itemId, value }) => {
                    return `${itemId === 'low' ? 'L' : 'H'}: ${value.toFixed(0)}`;
                },
            },
        },
    ],
};

AgChart.create(options);
