import { AgCartesianSeriesTooltipRendererParams, AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const interpolation = { type: 'smooth' } as const;
const tooltip = {
    renderer: ({ datum, xKey, yKey }: AgCartesianSeriesTooltipRendererParams) => {
        const date = Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(datum[xKey]);
        return { content: `${date}: ${Math.round(datum[yKey] / 100) / 10 + 'k'}` };
    },
};

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
            tooltip,
        },
        {
            type: 'area',
            xKey: 'date',
            stacked: true,
            yKey: 'National Media Museum',
            yName: 'National Media Museum',
            interpolation,
            tooltip,
        },
        {
            type: 'area',
            xKey: 'date',
            stacked: true,
            yKey: 'National Railway Museum',
            yName: 'National Railway Museum',
            interpolation,
            tooltip,
        },
        {
            type: 'area',
            xKey: 'date',
            stacked: true,
            yKey: 'Locomotion',
            yName: 'Locomotion',
            interpolation,
            tooltip,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Museum of Science and Industry, Manchester',
            yName: 'Museum of Science and Industry, Manchester',
            stacked: true,
            interpolation,
            tooltip,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'National Coal Mining Museum for England',
            yName: 'National Coal Mining Museum for England',
            stacked: true,
            interpolation,
            tooltip,
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
            label: {
                format: '%b',
            },
            nice: false,
            crossLines: [
                {
                    type: 'range',
                    range: [new Date(2019, 5, 1), new Date(2019, 8, 1)],
                    strokeWidth: 0,
                    label: {
                        text: 'Peak Season\nJun - Sep',
                        position: 'insideTop',
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
            label: {
                formatter: (params) => {
                    return params.value / 1000 + 'k';
                },
            },
        },
    ],
};

AgCharts.create(options);
