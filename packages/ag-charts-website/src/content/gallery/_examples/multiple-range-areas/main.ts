import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Social Media Market Share Over Time',
    },
    subtitle: {
        text: 'Market Share Range of Popular Social Media Platforms (2013-2023)',
    },
    series: Object.entries(getData()).map(([platform, data]) => ({
        data,
        type: 'range-area',
        xKey: 'year',
        xName: 'Year',
        yName: platform,
        yLowKey: 'shareLow',
        yHighKey: 'shareHigh',
        yLowName: 'Min Share',
        yHighName: 'Max Share',
        strokeWidth: 1,
        strokeOpacity: 0.4,
        fillOpacity: 0.35,
        marker: {
            enabled: false,
        },
        highlight: {
            highlightedDatum: {
                strokeWidth: 2,
                fillOpacity: 0.6,
            },
            highlightedSeries: {
                enabled: true,
                strokeWidth: 2,
                fillOpacity: 0.5,
                dimOpacity: 0.2,
            },
        },
    })),
    axes: [
        {
            type: 'number',
            position: 'left',
            nice: true,
            label: {
                formatter: ({ value }) => `${value}%`,
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [3, 3],
                    },
                ],
            },
            crossLines: [
                {
                    type: 'line',
                    value: 87.83,
                    lineDash: [6, 8],
                    strokeOpacity: 0.5,

                    label: {
                        text: 'Highest Share 88%',
                        position: 'inside-top-right',
                    },
                },
                {
                    type: 'line',
                    value: 60.15,
                    lineDash: [6, 8],
                    strokeOpacity: 0.5,

                    label: {
                        text: 'Lowest Share 60%',
                        position: 'inside-bottom-right',
                    },
                },
            ],
        },
        {
            type: 'category',
            position: 'bottom',
            bandHighlight: {
                enabled: true,
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
        },
    ],
    seriesArea: {
        padding: {
            left: 10,
            bottom: 10,
            right: 10,
            top: 10,
        },
    },
    legend: {
        position: 'bottom',
        item: {
            paddingX: 16,
            paddingY: 8,
        },
    },
    tooltip: {
        mode: 'shared',
    },
    formatter: {
        y: '#{.1f}%',
    },
};

AgCharts.create(options);
