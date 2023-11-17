import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Social Media Market Share Over Time',
    },
    subtitle: {
        text: 'Market Share of Popular Social Media Platforms from 2013 to 2023',
    },
    series: Object.entries(getData()).map(([platform, data]) => ({
        data,
        type: 'range-area',
        xKey: 'year',
        xName: 'Year',
        yName: platform,
        yLowKey: 'shareLow',
        yHighKey: 'shareHigh',
        strokeWidth: 0,
        fillOpacity: 0.5,
        marker: {
            enabled: true,
        },
    })),
    axes: [
        {
            type: 'number',
            position: 'left',
            tick: {
                values: [0, 25, 50, 75, 100],
            },
            label: {
                formatter: ({ value }) => `${value}%`,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 87.83,
                    lineDash: [6, 8],
                    strokeOpacity: 0.5,

                    label: {
                        text: 'Highest Share 88% ',
                        position: 'topRight',
                    },
                },
                {
                    type: 'line',
                    value: 60.15,
                    lineDash: [6, 8],
                    strokeOpacity: 0.5,

                    label: {
                        text: 'Lowest Share 60% ',
                        position: 'bottomRight',
                    },
                },
            ],
        },
        {
            type: 'category',
            position: 'bottom',
            nice: false,
            crossLines: [
                {
                    type: 'line',
                    value: '2017',
                    lineDash: [6, 8],
                    strokeOpacity: 0.5,
                    label: {
                        text: '2017',
                    },
                },
                {
                    type: 'line',
                    value: '2020',
                    lineDash: [6, 8],
                    strokeOpacity: 0.5,
                    label: {
                        text: '2020',
                    },
                },
            ],
        },
    ],
    seriesArea: {
        padding: {
            left: 20,
            bottom: 20,
        },
    },
    legend: {
        item: {
            marker: {
                shape: 'circle',
                strokeWidth: 2,
            },
        },
        position: 'top',
    },
};

AgEnterpriseCharts.create(options);
