import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const { socialCircle, domains } = getData();

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'SOCIAL CIRCLE',
    },
    animation: { enabled: false },
    series: Object.entries(socialCircle).map(([relationship, data]) => ({
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
            fillOpacity: 0.9,
        },
    })),
    axes: [
        {
            type: 'angle-number',
            label: {
                enabled: false,
            },
            line: {
                enabled: false,
            },
        },
        {
            type: 'radius-number',
            shape: 'circle',
            label: {
                enabled: false,
            },
            gridLine: {
                enabled: false,
            },
            crossLines: [
                {
                    type: 'line',
                    value: domains['intimate'][1],
                    strokeOpacity: 0.3,
                    label: {
                        text: 'INTIMATE',
                        padding: -30,
                    },
                },
                {
                    type: 'line',
                    value: domains['best friends'][1],
                    strokeOpacity: 0.3,
                    label: {
                        text: 'BEST FRIENDS',
                        padding: -30,
                    },
                },
                {
                    type: 'line',
                    value: domains['friends'][1],
                    strokeOpacity: 0.3,
                    label: {
                        text: 'FRIENDS',
                        padding: -30,
                    },
                },
                {
                    type: 'line',
                    value: domains['acquaintances'][1],
                    strokeWidth: 0,
                    label: {
                        text: 'ACQUAINTANCES',
                        padding: -30,
                    },
                },
            ],
        },
    ],
    legend: {
        position: 'top',
    },
};

AgCharts.create(options);
