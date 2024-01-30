import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Cattle Holdings and Beef Exports (UK)',
        fontSize: 18,
    },
    subtitle: {
        text: 'Source: Department for Environment, Food & Rural Affairs',
    },
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'male',
            yName: 'Male cattle',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'female',
            yName: 'Female cattle',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'exportedTonnes',
            yName: 'Beef exports',
            strokeWidth: 5,
            marker: {
                enabled: false,
            },
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
            keys: ['male', 'female'],
            title: {
                text: 'Number of cattle',
            },
            label: {
                formatter: (params) => {
                    return params.value / 1000 + 'M';
                },
            },
        },
        {
            type: 'number',
            position: 'right',
            keys: ['exportedTonnes'],
            title: {
                enabled: true,
                text: 'Exports (tonnes)',
            },
            label: {
                formatter: (params) => {
                    return params.value / 1000 + 'k';
                },
            },
        },
    ],
    legend: {
        item: {
            marker: {
                shape: 'square',
                strokeWidth: 0,
            },
        },
    },
};

const chart = AgCharts.create(options);
