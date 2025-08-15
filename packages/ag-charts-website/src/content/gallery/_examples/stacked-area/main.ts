import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Science Museums Visitors',
    },
    footnote: {
        text: 'Source: Department for Digital, Culture, Media & Sport',
    },
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Science Museum',
            yName: 'Science Museum',
            stacked: true,
            interpolation: { type: 'smooth' },
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'National Media Museum',
            yName: 'National Media Museum',
            stacked: true,
            interpolation: { type: 'smooth' },
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'National Railway Museum',
            yName: 'National Railway Museum',
            stacked: true,
            interpolation: { type: 'smooth' },
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Locomotion',
            yName: 'Locomotion',
            stacked: true,
            interpolation: { type: 'smooth' },
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Museum of Science and Industry, Manchester',
            yName: 'Museum of Science and Industry, Manchester',
            stacked: true,
            interpolation: { type: 'smooth' },
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'National Coal Mining Museum for England',
            yName: 'National Coal Mining Museum for England',
            stacked: true,
            interpolation: { type: 'smooth' },
        },
    ],
    axes: [
        {
            type: 'unit-time',
            position: 'bottom',
            label: {
                format: '%b',
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
            crossLines: [
                {
                    type: 'range',
                    range: [new Date(2019, 6, 1), new Date(2019, 7, 31)],
                    fillOpacity: 0.1,
                    label: {
                        text: 'Peak Season',
                        position: 'top',
                    },
                },
            ],
        },
        {
            type: 'number',
            position: 'left',
            label: {
                formatter: (params) => {
                    const value = params.value as number;
                    if (value >= 1000) {
                        return `${Math.round(value / 1000)}k`;
                    }
                    return String(value);
                },
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
        },
    ],
    legend: {
        position: 'bottom',
    },
    tooltip: {
        mode: 'shared',
        position: {
            placement: ['right', 'left', 'top', 'bottom'],
        },
    },
    theme: {
        overrides: {
            area: {
                series: {
                    fillOpacity: 0.7,
                    strokeWidth: 2,
                    highlight: {
                        enabled: true,
                    },
                },
            },
        },
    },
};

AgCharts.create(options);
