import { CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import { BandHighlightModule, RangeBarSeriesModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BandHighlightModule, CategoryAxisModule, NumberAxisModule, RangeBarSeriesModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Product Export and Import Amounts by Country',
    },
    subtitle: {
        text: 'Trade Activities Across Selected Products',
        spacing: 30,
    },
    footnote: {
        text: '2023 import and export amounts in USD based on international trade records',
        spacing: 30,
    },
    series: Object.entries(getData()).map(([country, data]) => ({
        data,
        type: 'range-bar',
        direction: 'horizontal',
        xKey: 'product',
        xName: 'Product',
        yLowKey: 'exportAmount',
        yHighKey: 'importAmount',
        yLowName: 'Export',
        yHighName: 'Import',
        yName: country,
        cornerRadius: 4,
        tooltip: {
            renderer: (params) => {
                const { datum, yLowKey, yHighKey, yName } = params;
                const exportVal = datum[yLowKey];
                const importVal = datum[yHighKey];
                const tradeBalance = importVal - exportVal;

                return {
                    heading: datum.product,
                    title: yName,
                    data: [
                        {
                            label: 'Export',
                            value: `$${(exportVal / 1000000).toFixed(1)}M`,
                        },
                        {
                            label: 'Import',
                            value: `$${(importVal / 1000000).toFixed(1)}M`,
                        },
                        {
                            label: 'Trade Balance',
                            value: `${tradeBalance > 0 ? '+' : ''}$${(tradeBalance / 1000000).toFixed(1)}M`,
                        },
                    ],
                };
            },
        },
    })),
    tooltip: {
        position: {
            placement: ['right', 'left', 'top', 'bottom'],
        },
    },
    axes: {
        y: {
            type: 'category',
            position: 'right',
            groupPaddingInner: 0.2,
            paddingInner: 0.5,
            paddingOuter: 0.8,
            line: {
                enabled: false,
            },
            gridLine: {
                enabled: true,
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [2, 2],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
            bandHighlight: {
                enabled: true,
            },
        },
        x: {
            type: 'number',
            position: 'top',
            nice: false,
            min: 0,
            max: 35000000,
            interval: { values: [3000000, 32000000] },
            title: {
                text: 'Trade Volume (USD)',
            },
            label: {
                formatter: ({ value }) => `$${(value / 1000000).toFixed(0)}M`,
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [3, 3],
                    },
                ],
            },
        },
    },
};

AgCharts.create(options);
