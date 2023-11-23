import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { data } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'treemap',
            labelKey: 'name',
            secondaryLabelKey: 'change',
            sizeName: 'Valuation',
            sizeKey: 'valuation',
            colorName: 'Change',
            colorKey: 'change',
            group: {
                label: {
                    formatter({ value }) {
                        return value.toUpperCase();
                    },
                },
            },
            tile: {
                label: {
                    overflowStrategy: 'hide',
                },
                secondaryLabel: {
                    overflowStrategy: 'hide',
                    formatter(params) {
                        return params.value.toFixed(2) + '%';
                    },
                },
                strokeWidth: 0,
                gap: 1,
            },
        },
    ],
    gradientLegend: {
        stop: {
            label: {
                formatter: ({ value }) => `${Number(value).toFixed(0)}%`,
            },
        },
    },
    title: {
        text: 'S&P 500 index stocks categorized by sectors and industries',
    },
    subtitle: {
        text: 'Area represents market cap. Color represents change from the day before',
    },
};

AgCharts.create(options);
