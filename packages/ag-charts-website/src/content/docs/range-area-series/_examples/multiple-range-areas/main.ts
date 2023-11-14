import { AgChart, AgChartOptions } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: `Wind Electricity Capacity`,
    },
    subtitle: {
        text: `2022 - 2024`,
    },
    series: [
        {
            type: 'range-area',
            xKey: 'location',
            xName: 'Geographical Region',
            yLowKey: '2022',
            yHighKey: '2023',
            yName: 'Onshore Wind Capacity 2022 - 2023',
            fill: '#205C37',
            stroke: '#205C37',
            stacked: false,
        },
        {
            type: 'range-area',
            xKey: 'location',
            xName: 'Geographical Region',
            yLowKey: '2023',
            yHighKey: '2024',
            yName: 'Onshore Wind Capacity 2023 - 2024',
            fill: '#D1C0A8',
            stroke: '#D1C0A8',
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'GW',
            },
        },
    ],
    footnote: {
        text: 'Renewable Energy Market',
    },
};

AgChart.create(options);
