import type { AgChartOptions } from 'ag-charts-community';
import { AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    theme: {
        overrides: {
            area: {
                series: {
                    fillOpacity: 0.8,
                },
            },
        },
    },
    title: {
        text: 'Total Visitors to Tate Galleries',
        fontSize: 18,
        spacing: 25,
    },
    footnote: {
        text: 'Source: Department for Digital, Culture, Media & Sport',
    },
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Modern',
            fill: '#c16068',
            yName: 'Tate Modern',
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Britain',
            fill: '#a2bf8a',
            yName: 'Tate Britain',
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Liverpool',
            fill: '#ebcc87',
            yName: 'Tate Liverpool',
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate St Ives',
            fill: '#80a0c3',
            yName: 'Tate St Ives',
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
            interval: {
                step: { unit: 'year', step: 2 },
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Total visitors',
            },
            label: {
                formatter: (params) => {
                    return params.value / 1000 + 'k';
                },
            },
        },
    },
};

AgCharts.create(options);
