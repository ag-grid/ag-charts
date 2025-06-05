import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Total Visitors to Museums and Galleries',
    },
    footnote: {
        text: 'Source: Department for Digital, Culture, Media & Sport',
    },
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'visitors',
            label: {
                enabled: true,
            },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
            title: {
                text: 'Year',
            },
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Total Visitors',
            },
        },
    ],
    formatter: {
        y(params) {
            let value = params.value as number;
            value /= 1000_000;
            return `${Math.floor(value)}M`;
        },
    },
};

AgCharts.create(options);
