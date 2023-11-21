import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'sunburst',
            labelKey: 'name',
            secondaryLabelKey: 'capacity',
            sizeKey: 'capacity',
            colorKey: 'commissioned',
            colorRange: ['#AFB42B', '#8BC34A'],
            fills: ['#7CB342'],
            secondaryLabel: {
                formatter: ({ value }) => (value != null ? `${value?.toFixed(0)} MW` : undefined),
            },
        },
    ],
    title: {
        text: 'Offshore Wind Farms by Country.',
    },
    subtitle: {
        text: 'Wind farms with at least 400 MW capacity.',
    },
};

AgCharts.create(options);
