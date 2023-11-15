import { AgCartesianSeriesTooltipRendererParams, AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const tooltip = {
    renderer: ({ datum, xKey, yKey }: AgCartesianSeriesTooltipRendererParams) => {
        const date = Intl.DateTimeFormat('en-GB').format(datum[xKey]);
        return { content: `${date}: ${Math.round(datum[yKey] / 100) / 10 + 'k'}` };
    },
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Total Visitors to Tate Galleries',
    },
    footnote: {
        text: 'Source: Department for Digital, Culture, Media & Sport',
    },
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Modern',
            yName: 'Tate Modern',
            tooltip,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Britain',
            yName: 'Tate Britain',
            tooltip,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Liverpool',
            yName: 'Tate Liverpool',
            tooltip,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate St Ives',
            yName: 'Tate St Ives',
            tooltip,
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
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
