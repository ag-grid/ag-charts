import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Eating Hours In A Day',
    },
    subtitle: {
        text: 'Hours spent per day eating and drinking by age group',
    },
    footnote: {
        text: 'Source: American Time Use Survey (2012-2022)',
    },
    series: Object.entries(getData()).map(([ageGroup, data]) => ({
        data,
        type: 'line',
        xKey: 'year',
        yKey: 'estimate',
        yName: ageGroup,
        label: {
            enabled: true,
        },
        marker: {
            size: 10,
        },
    })),
    axes: [
        {
            type: 'category',
            position: 'bottom',
            label: {
                enabled: false,
            },
            line: {
                enabled: false,
            },
            crosshair: {
                enabled: true,
            },
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Time',
            },
            interval: { step: 0.5 },
            gridLine: {
                enabled: false,
            },
            tick: {
                size: 20,
            },
            line: {
                enabled: true,
            },
            crossLines: [
                {
                    type: 'line',
                    value: 0.75,
                    strokeOpacity: 0.5,
                    lineDash: [6, 4],
                    label: {
                        text: '>Year',
                        fontSize: 13,
                        padding: 0,
                        position: 'right',
                    },
                },
            ],
        },
    ],
    seriesArea: {
        padding: {
            left: 10,
            bottom: 10,
        },
    },
    formatter: {
        y(params) {
            const value = params.value as number;

            if (params.source === 'series-label') {
                return `${Math.round(value * 60)}m`;
            }

            const hours = Math.floor(value);
            const minutes = Math.round((value % 1) * 60);
            const minutesString = String(minutes).padStart(2, '0');
            if (params.source !== 'axis-label') {
                return `${hours}h ${minutesString}m`;
            }

            if (hours === 0) {
                return `${minutes}m`;
            } else if (minutes === 0) {
                return `${hours}h`;
            }
            return `${hours}h ${minutesString}m`;
        },
    },
};

AgCharts.create(options);
