import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const dateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short' });
const yearFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric' });

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: `Understanding Japan's Seismic Hazard`,
    },
    subtitle: {
        text: `Earthquake Magnitude Range from 1958 to 2023`,
    },
    animation: {
        enabled: true,
        duration: 800,
    },
    tooltip: {
        mode: 'compact',
    },
    series: [
        {
            type: 'range-area',
            xKey: 'year',
            xName: 'Year',
            yLowKey: 'magnitudeLow',
            yHighKey: 'magnitudeHigh',
            yLowName: 'Minimum Magnitude',
            yHighName: 'Maximum Magnitude',
            strokeWidth: 2,
            fillOpacity: 0.5,
            interpolation: {
                type: 'smooth',
            },
            // tooltip: {
            //     renderer: ({ datum, xKey, yLowKey, yHighKey }) => {
            //         const year = datum[xKey];
            //         const minMagnitude = datum[yLowKey];
            //         const maxMagnitude = datum[yHighKey];
            //         const deaths = datum.deathTotal;

            //         return {
            //             title: `Statistics`,
            //             data: [
            //                 { label: 'Magnitude Range', value: `${minMagnitude} - ${maxMagnitude}` },
            //                 { label: 'Deaths', value: deaths.toLocaleString() },
            //             ],
            //         };
            //     },
            // },
            marker: {
                enabled: true,
                size: 6,
            },
        },
    ],
    axes: [
        {
            type: 'unit-time',
            position: 'bottom',
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
            title: {
                text: 'Year',
            },
            crossLines: [
                {
                    type: 'line',
                    value: new Date(2011, 2, 11),
                    strokeWidth: 2,
                    lineDash: [5, 5],
                    label: {
                        text: '2011 Tōhoku Earthquake',
                    },
                },
                {
                    type: 'line',
                    value: new Date(1995, 0, 17),
                    strokeWidth: 2,
                    lineDash: [5, 5],
                    label: {
                        text: '1995 Kobe Earthquake',
                    },
                },
            ],
        },
        {
            type: 'number',
            position: 'left',
            min: 4,
            max: 10,
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
            title: {
                text: 'Magnitude (Richter Scale)',
            },
        },
    ],
    legend: {
        enabled: false,
    },
};

AgCharts.create(options);
