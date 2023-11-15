import { AgCharts, AgChartOptions } from 'ag-charts-enterprise';

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
                    formatter({ value }) {
                        return value.toUpperCase();
                    },
                },
                textAlign: 'left',
            },
            tile: {
                secondaryLabel: {
                    formatter(params) {
                        return params.value.toFixed(2) + '%';
                    },
                },
            },
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
                        content: `<b>Change</b>: ${params.datum[params.colorKey!].toFixed(2)}%`,
                    };
                },
            },
            formatter: (params) => ({
                fill: !params.datum.children ? undefined : params.highlighted ? '#aaa' : '#333',
                stroke: params.depth < 1 ? 'white' : 'black',
            }),
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
