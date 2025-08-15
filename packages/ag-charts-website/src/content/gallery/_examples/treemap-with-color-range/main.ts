import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, data } from './data';

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data,
    theme: {
        overrides: {
            treemap: {
                series: {
                    highlightStyle: {
                        tile: {
                            strokeWidth: 3,
                        },
                    },
                    tile: {
                        strokeWidth: 2,
                        gap: 2,
                        label: {
                            overflowStrategy: 'hide',
                            minimumFontSize: 10,
                        },
                        secondaryLabel: {
                            overflowStrategy: 'hide',
                            minimumFontSize: 8,
                        },
                    },
                    group: {
                        strokeWidth: 3,
                        gap: 4,
                        label: {},
                    },
                },
            },
        },
    },
    series: [
        {
            type: 'treemap',
            labelKey: 'name',
            secondaryLabelKey: 'change',
            sizeName: 'Market Cap',
            sizeKey: 'valuation',
            colorName: 'Daily Change',
            colorKey: 'change',
            colorRange: ['#d32f2f', '#f44336', '#ffb74d', '#fff9c4', '#c5e1a5', '#66bb6a', '#2e7d32'],
            group: {
                label: {
                    formatter({ value }) {
                        return value.toUpperCase();
                    },
                },
                strokeWidth: 3,
                padding: 4,
            },
            tile: {
                label: {
                    overflowStrategy: 'hide',
                    wrapping: 'hyphenate',
                },
                secondaryLabel: {
                    overflowStrategy: 'hide',
                    formatter(params) {
                        const value = params.value || 0;
                        const symbol = value >= 0 ? '+' : '';
                        return `${symbol}${value.toFixed(2)}%`;
                    },
                },
                strokeWidth: 1,
                gap: 2,
                cornerRadius: 2,
            },
        },
    ],
    gradientLegend: {
        enabled: true,
        position: 'bottom',
        gradient: {
            thickness: 15,
            preferredLength: 400,
        },
        scale: {
            label: {
                formatter: ({ value }) => {
                    const num = Number(value);
                    if (num > 0) return `+${num.toFixed(0)}%`;
                    return `${num.toFixed(0)}%`;
                },
            },
        },
        spacing: 30,
    },
    title: {
        text: 'S&P 500 Index Stocks by Sector Performance',
    },
    subtitle: {
        text: `Market capitalization shown by tile size • Daily price change shown by color\nData as of ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    },
};

AgCharts.create(options);
