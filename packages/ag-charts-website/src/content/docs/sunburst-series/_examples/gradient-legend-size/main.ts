import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';

const gdpFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const percentageFormatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    signDisplay: 'always',
});

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: data,
    series: [
        {
            type: 'sunburst',
            labelKey: 'name',
            colorKey: 'gdpChange',
            colorName: 'Change',
        },
    ],
    gradientLegend: {
        gradient: {
            thickness: 50,
            preferredLength: 400,
        },
    },
    title: {
        text: 'Top 10 countries by GDP',
    },
    subtitle: {
        text: '2023',
    },
};

AgCharts.create(options);
