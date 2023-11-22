import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';

const formatter = new Intl.NumberFormat('en-US', {
    useGrouping: true,
    maximumFractionDigits: 0,
});

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'treemap',
            labelKey: 'name',
            secondaryLabelKey: 'gdp',
            sizeKey: 'gdp',
            tile: {
                label: {
                    minimumFontSize: 9,
                },
                secondaryLabel: {
                    minimumFontSize: 6,
                    formatter: ({ value }) => (value != null ? `$${formatter.format(value)} B` : undefined),
                },
                padding: 6,
            },
        },
    ],
    title: {
        text: 'Countries by GDP',
    },
};

AgCharts.create(options);
