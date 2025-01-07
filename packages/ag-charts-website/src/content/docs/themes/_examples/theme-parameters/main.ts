import { AgChartOptions, AgChartTheme, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const myTheme: AgChartTheme = {
    params: {
        fontFamily: 'Georgia, serif',
        fontSize: 16,
    },
};

const options: AgChartOptions = {
    theme: myTheme,
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Weekly Earnings',
    },
    footnote: {
        text: 'Source: Office for National Statistics',
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'type',
            yKey: 'earnings',
            cornerRadius: 4,
            label: {
                formatter: ({ value }) => `£${value.toFixed(0)}`,
            },
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'left',
        },
        {
            type: 'number',
            position: 'bottom',
            title: {
                text: '£ / Week',
            },
            label: {
                formatter: ({ value }) => `£${value.toFixed(0)}`,
            },
        },
    ],
};

AgCharts.create(options);
