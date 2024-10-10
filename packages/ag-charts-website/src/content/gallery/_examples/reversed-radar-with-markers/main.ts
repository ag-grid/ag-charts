import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'FRIENDS & ACQUAINTANCES',
    },
    animation: { enabled: false },
    series: Object.entries(getData()).map(([relationship, data]) => ({
        data,
        type: 'radar-line',
        angleKey: 'recognitionTime',
        angleName: 'Recognition Time',
        radiusKey: 'closeness',
        radiusName: `${relationship
            .split(' ')
            .map((word) => `${word[0].toUpperCase()}${word.substring(1)}`)
            .join(' ')}`,
        strokeWidth: 0,
        marker: {
            strokeWidth: 1,
            fillOpacity: 0.1,
        },
    })),
    axes: [
        {
            type: 'angle-number',
            label: {
                padding: 0,
            },
            line: {
                enabled: false,
            },
        },
        {
            type: 'radius-number',
            shape: 'circle',
            reverse: true,
            label: {
                enabled: false,
            },
            interval: {
                step: 0.4,
            },
        },
    ],
    legend: {
        enabled: false,
    },
};

AgCharts.create(options);
