import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const formatTime = (value: number) => {
    const hours = Math.floor(value);
    const minutes = Math.round((value % 1) * 60);
    return `${hours > 0 ? hours + 'h' : ''} ${minutes + 'm'}`;
};

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
            formatter: ({ value }) => `${Math.floor(value) * 60 + Math.round((value % 1) * 60)}m`,
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
            interval: 0.5,
            gridLine: {
                enabled: false,
            },
            tick: {
                size: 20,
            },
            line: {
                width: 1,
            },
            label: {
                formatter: ({ value }) => formatTime(value),
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
            crosshair: {
                label: {
                    renderer: ({ value }) => ({
                        text: formatTime(value),
                    }),
                },
            },
        },
    ],
    seriesArea: {
        padding: {
            left: 10,
            bottom: 10,
        },
    },
};

AgCharts.create(options);
