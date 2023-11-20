import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const data = getData();

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Average Temperatures By Continent',
    },
    series: Object.entries(data).map(([continent, temperatures]) => ({
        data: temperatures,
        type: 'range-bar',
        xKey: 'month',
        xName: 'Month',
        yName: continent,
        yLowKey: 'lowTemperature',
        yHighKey: 'highTemperature',
    })),
    axes: [
        {
            type: 'category',
            position: 'bottom',
            paddingInner: 0.5,
            groupPaddingInner: 0,
            gridLine: {
                enabled: true,
            },
            line: {
                width: 0,
            },
            tick: {
                size: 15,
            },
        },
        {
            type: 'number',
            position: 'right',
            spacing: 40,
            gridLine: {
                enabled: false,
            },
            label: {
                padding: 15,
                formatter: ({ value }) => `${value} ℃`,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 42,
                    lineDash: [5, 7],
                    strokeOpacity: 0.5,
                    label: {
                        text: '42 ℃',
                    },
                },
                {
                    type: 'line',
                    value: 5,
                    lineDash: [5, 7],
                    strokeOpacity: 0.5,
                    label: {
                        text: '5 ℃',
                        position: 'bottom',
                    },
                },
            ],
        },
    ],
};

AgCharts.create(options);
