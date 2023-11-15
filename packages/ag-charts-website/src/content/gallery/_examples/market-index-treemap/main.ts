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
            },
            tile: {
                label: {
                    color: 'black',
                },
                secondaryLabel: {
                    color: 'black',
                    formatter(params) {
                        return params.value.toFixed(2) + '%';
                    },
                },
            },
            tileSpacing: 1,
            highlightStyle: {
                tile: {
                    label: {
                        color: 'black',
                    },
                    secondaryLabel: {
                        color: 'black',
                    },
                },
            },
            tooltip: {
                renderer: (params) => {
                    return {
                        content: `<b>Change</b>: ${params.datum.change.toFixed(2)}%`,
                    };
                },
            },
            formatter: ({ datum, depth, highlighted }) => {
                if (!datum.children) {
                    return {
                        stroke: 'rgba(0, 0, 0, 0.4)',
                        strokeWidth: highlighted ? 2 : 0,
                    };
                } else if (depth < 1) {
                    return {
                        fill: highlighted ? '#888' : '#333',
                        stroke: 'white',
                    };
                } else {
                    return {
                        fill: highlighted ? '#888' : '#333',
                        stroke: highlighted ? '#888' : 'black',
                    };
                }
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
