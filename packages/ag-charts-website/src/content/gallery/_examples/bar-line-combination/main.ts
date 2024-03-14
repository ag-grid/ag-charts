import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Ad Campaign Impact',
    },
    subtitle: {
        text: 'Yearly Percentage Change in Advertisement Engagement',
    },
    footnote: {
        text: '2018 to 2023',
    },
    theme: {
        overrides: {
            line: {
                series: {
                    marker: {
                        enabled: false,
                    },
                    lineDash: [5, 8],
                },
            },
            bar: {
                series: {
                    fillOpacity: 0.9,
                },
            },
        },
    },
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'desktop',
            yName: 'Desktop',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'phone',
            yName: 'Phone',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'tv',
            yName: 'TV',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'tablet',
            yName: 'Tablet',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'radio',
            yName: 'Radio',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'billboard',
            yName: 'Billboard',
        },
    ],
    axes: [
        {
            type: 'category',
            position: 'top',
            paddingInner: 0.4,
            line: {
                enabled: false,
            },
            gridLine: {
                enabled: true,
            },
        },
        {
            type: 'number',
            position: 'left',
            label: {
                enabled: false,
            },
            tick: {
                size: 0,
                values: [0],
            },
            gridLine: {
                width: 2,
            },
            crosshair: {
                enabled: false,
            },
        },
    ],
    legend: {
        item: {
            marker: {
                shape: 'circle',
            },
        },
    },
};

AgCharts.create(options);
