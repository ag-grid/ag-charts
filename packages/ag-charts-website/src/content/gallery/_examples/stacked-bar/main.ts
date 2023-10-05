import {
    AgCartesianSeriesTooltipRendererParams,
    AgChartOptions,
    AgEnterpriseCharts,
    AgTooltipRendererResult,
} from 'ag-charts-enterprise';

import { getData } from './data';

const numFormatter = new Intl.NumberFormat('en-US');
const tooltip = {
    renderer: ({ title, datum, xKey, yKey }: AgCartesianSeriesTooltipRendererParams): AgTooltipRendererResult => ({
        title,
        content: `${datum[xKey]}: ${numFormatter.format(datum[yKey])}`,
    }),
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Average Station Entries',
        fontSize: 18,
    },
    subtitle: {
        text: 'Victoria Line (2010)',
    },
    footnote: {
        text: 'Source: Transport for London',
    },
    series: [
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'early',
            stacked: true,
            yName: 'Early',
            tooltip,
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'morningPeak',
            yName: 'Morning peak',
            stacked: true,
            tooltip,
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'interPeak',
            yName: 'Between peak',
            stacked: true,
            tooltip,
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'afternoonPeak',
            yName: 'Afternoon peak',
            stacked: true,
            tooltip,
        },
        {
            type: 'bar',
            xKey: 'station',
            yKey: 'evening',
            yName: 'Evening',
            stacked: true,
            tooltip,
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
            label: {
                formatter: (params) => {
                    return params.value / 1000 + 'k';
                },
            },
        },
    ],
    padding: {
        bottom: 40,
    },
};

AgEnterpriseCharts.create(options);
