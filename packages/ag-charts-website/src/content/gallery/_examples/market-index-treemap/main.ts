import { AgChartOptions, AgEnterpriseCharts } from 'ag-charts-enterprise';

import { data } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'treemap',
            labelKey: 'name',
            secondaryLabelKey: 'change',
            sizeKey: 'valuation',
            colorKey: 'change',
            group: {
                label: {
                    color: 'white',
                    formatter({ value }) {
                        return value.toUpperCase();
                    },
                },
                textAlign: 'left',
                fill: '#333',
                stroke: '#333',
                strokeWidth: 1,
                padding: 2,
            },
            tile: {
                label: {
                    color: '#333',
                },
                secondaryLabel: {
                    color: '#333',
                    formatter(params) {
                        return params.value.toFixed(2) + '%';
                    },
                },
                strokeWidth: 0,
            },
            tileSpacing: 1,
            highlightStyle: {
                group: {
                    fill: '#888',
                    stroke: '#888',
                },
                tile: {
                    label: {
                        color: '#333',
                    },
                    secondaryLabel: {
                        color: '#333',
                    },
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

AgEnterpriseCharts.create(options);
