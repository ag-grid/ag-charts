import { AgAxisLabelStylerParams, AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'close',
            title: 'S&P 500',
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'left',
            title: { text: 'Index Value (USD)' },
            label: {
                format: '$#{0>0.2f}',
                cornerRadius: 8,
                fill: 'rgba(252, 255, 197)',
                fillOpacity: 0.7,
                padding: 10,
                border: {
                    stroke: '#AAA',
                    strokeWidth: 3,
                    strokeOpacity: 0.2,
                },
                itemStyler: (params: AgAxisLabelStylerParams<unknown>) => {
                    if (params.value === 5000) {
                        return {
                            border: {
                                stroke: 'red',
                                strokeWidth: 6,
                                strokeOpacity: 1,
                            },
                            padding: 15,
                            fontWeight: 'bold',
                            fill: {
                                type: 'gradient',
                                colorStops: [
                                    { color: '#70C1FF', stop: 0.1 },
                                    { color: '#FFD86F', stop: 0.3 },
                                    { color: '#FF9A60', stop: 0.5 },
                                    { color: '#D16BA5' },
                                ],
                            },
                        };
                    }
                },
            },
        },
        {
            type: 'unit-time',
            position: 'bottom',
            label: {
                rotation: -30,
                format: '%b %Y',
                cornerRadius: 2,
                fill: 'rgba(252, 197, 255)',
                fillOpacity: 0.7,
                padding: 5,
                border: {
                    stroke: '#A0A',
                    strokeWidth: 1,
                    strokeOpacity: 1,
                },
            },
        },
    ],
    data: getData(),
};

AgCharts.create(options);
