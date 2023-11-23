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
        stop: {
            label: {
                fontSize: 20,
                fontStyle: 'italic',
                fontWeight: 'bold',
                fontFamily: 'serif',
                color: 'red',
            },
            padding: 20,
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
