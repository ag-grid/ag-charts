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
            label: {
                minimumFontSize: 7,
            },
            secondaryLabel: {
                minimumFontSize: 5,
                formatter: ({ value }) => (value != null ? `${value.toFixed(0)} MW` : undefined),
            },
        },
    ],
    title: {
        text: 'Offshore Wind Farms by Country.',
    },
    subtitle: {
        text: 'Wind farms with at least 500 MW capacity.',
    },
};

AgCharts.create(options);
