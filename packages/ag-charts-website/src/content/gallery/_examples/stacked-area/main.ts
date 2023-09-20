import { AgEnterpriseCharts, AgChartOptions, AgCartesianSeriesTooltipRendererParams } from 'ag-charts-enterprise';
import { getData } from './data';

const tooltip = {
    renderer: ({ xValue, yValue }: AgCartesianSeriesTooltipRendererParams) => {
        const date = Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric' }).format(
            xValue
        );
        return { content: `${date}: ${Math.round(yValue / 100) / 10 + 'k'}` };
    },
}
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Total Visitors to Science Museums',
    },
    footnote: {
        text: 'Source: Department for Digital, Culture, Media & Sport',
    },
    series: [
        { type: 'area', xKey: 'date', stacked: true, yKey: 'Science Museum', yName: 'Science Museum' },
        {
            type: 'area',
            xKey: 'date',
            stacked: true,
            yKey: 'National Media Museum',
            yName: 'National Media Museum',
            tooltip
        },
        {
            type: 'area',
            xKey: 'date',
            stacked: true,
            yKey: 'National Railway Museum',
            yName: 'National Railway Museum',
            tooltip
        },
        {
            type: 'area',
            xKey: 'date',
            stacked: true,
            yKey: 'Locomotion',
            yName: 'Locomotion',
            tooltip
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Museum of Science and Industry, Manchester',
            yName: 'Museum of Science and Industry, Manchester',
            stacked: true,
            tooltip
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'National Coal Mining Museum for England',
            yName: 'National Coal Mining Museum for England',
            stacked: true,
            tooltip
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
            label: {
                format: '%b',
            },
            nice: false
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

AgEnterpriseCharts.create(options);
