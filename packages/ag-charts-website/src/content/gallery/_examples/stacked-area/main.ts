import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const interpolation = { type: 'smooth' } as const;

const options: AgChartOptions = {
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
            stacked: true,
            yKey: 'Science Museum',
            yName: 'Science Museum',
            interpolation,
        },
        {
            type: 'area',
            xKey: 'date',
            stacked: true,
            yKey: 'National Media Museum',
            yName: 'National Media Museum',
            interpolation,
        },
        {
            type: 'area',
            xKey: 'date',
            stacked: true,
            yKey: 'National Railway Museum',
            yName: 'National Railway Museum',
            interpolation,
        },
        {
            type: 'area',
            xKey: 'date',
            stacked: true,
            yKey: 'Locomotion',
            yName: 'Locomotion',
            interpolation,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Museum of Science and Industry, Manchester',
            yName: 'Museum of Science and Industry, Manchester',
            stacked: true,
            interpolation,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'National Coal Mining Museum for England',
            yName: 'National Coal Mining Museum for England',
            stacked: true,
            interpolation,
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
            crossLines: [
                {
                    type: 'range',
                    range: [new Date(2019, 5, 1), new Date(2019, 8, 1)],
                    strokeWidth: 0,
                    label: {
                        text: 'Peak Season\nJun - Sep',
                        position: 'inside-top',
                    },
                },
            ],
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Total visitors',
            },
        },
    ],
    formatter: {
        y: (params) => {
            if (params.type !== 'number') return;
            return (params.value / 1000).toFixed(params.fractionDigits) + 'k';
        },
    },
};

AgCharts.create(options);
