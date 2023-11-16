import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'treemap',
            labelKey: 'name',
            secondaryLabelKey: 'color',
            sizeKey: 'size',
            colorKey: 'color',
            group: {
                label: {
                    color: 'white',
                    formatter({ value }) {
                        return value.toUpperCase();
                    },
                },
                textAlign: 'left',
                fill: '#2c3e50',
                strokeWidth: 0,
                padding: 2,
            },
            tile: {
                label: {
                    color: '#34495e',
                },
                secondaryLabel: {
                    color: '#34495e',
                    formatter(params) {
                        return params.value.toFixed(2) + '%';
                    },
                },
                strokeWidth: 0,
            },
            tileSpacing: 1,
            highlightStyle: {
                group: {
                    fill: '#34495e',
                },
                tile: {
                    label: {
                        color: '#34495e',
                    },
                    secondaryLabel: {
                        color: '#34495e',
                    },
                },
            },
            tooltip: {
                renderer: (params) => {
                    return {
                        content: `<b>Change</b>: ${params.datum[params.colorKey!].toFixed(2)}%`,
                    };
                },
            },
        },
    ],
    title: {
        text: 'S&P 500 index stocks categorized by sectors and industries.',
    },
    subtitle: {
        text: 'Area represents market cap. Color represents change from the day before.',
    },
};

AgCharts.create(options);
