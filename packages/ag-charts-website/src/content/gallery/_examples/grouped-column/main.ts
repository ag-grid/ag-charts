import { AgChart, AgChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Regular Internet Users',
    },
    footnote: {
        text: 'Source: Office for National Statistics',
    },
    series: [
        { type: 'bar', xKey: 'year', yKey: '16-24' },
        { type: 'bar', xKey: 'year', yKey: '25-34' },
        { type: 'bar', xKey: 'year', yKey: '35-44' },
        { type: 'bar', xKey: 'year', yKey: '45-54' },
        { type: 'bar', xKey: 'year', yKey: '55-64' },
        { type: 'bar', xKey: 'year', yKey: '65-74' },
        { type: 'bar', xKey: 'year', yKey: '75+' },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
            label: {
                formatter: ({ value }) => `${value / 1000}M`,
            },
        },
    ],
};

AgChart.create(options);
