import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { CategoryAxisModule, NumberAxisModule, ModuleRegistry } from 'ag-charts-community';
import { GradientLegendModule, TreemapSeriesModule } from 'ag-charts-enterprise';

import { DataType, data } from './data';


ModuleRegistry.registerModules([CategoryAxisModule, GradientLegendModule, NumberAxisModule, TreemapSeriesModule]);
const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data,
    theme: {
        overrides: {
            treemap: {
                series: {
                    tile: {
                        highlight: {
                            highlightedItem: {
                                strokeWidth: 3,
                            },
                        },
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
                padding: 4,
            },
            tile: {
                cornerRadius: 4,
                secondaryLabel: {
                    formatter(params) {
                        const value = params.value || 0;
                        const symbol = value >= 0 ? '+' : '';
                        return `${symbol}${value.toFixed(2)}%`;
                    },
                },
                gap: 2,
            },
        },
    ],
    gradientLegend: {
        enabled: true,
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
        text: `Market capitalization shown by tile size • Daily price change shown by color`,
    },
};

AgCharts.create(options);
