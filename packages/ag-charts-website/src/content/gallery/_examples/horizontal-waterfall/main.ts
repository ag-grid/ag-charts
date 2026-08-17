import {
    AgCartesianChartOptions,
    AgCharts,
    BandHighlightModule,
    CategoryAxisModule,
    ContextMenuModule,
    ModuleRegistry,
    NumberAxisModule,
    WaterfallSeriesModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BandHighlightModule, CategoryAxisModule, NumberAxisModule, WaterfallSeriesModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'UK Government Budget',
    },
    subtitle: {
        text: 'All values in £ billions',
    },
    series: [
        {
            type: 'waterfall',
            direction: 'horizontal',
            xKey: 'financials',
            xName: 'Financials',
            yKey: 'amount',
            yName: 'Amount',
            totals: [
                {
                    totalType: 'total',
                    index: 4,
                    axisLabel: 'Total Budget',
                },
                {
                    totalType: 'subtotal',
                    index: 10,
                    axisLabel: 'Total Spending',
                },
            ],
            line: {
                enabled: false,
            },
            item: {
                positive: {
                    fillOpacity: 0.3,
                    label: {
                        enabled: true,
                        formatter: (params) => {
                            const value = params.value as number;
                            return `+£${value}B`;
                        },
                    },
                },
                negative: {
                    fillOpacity: 0.3,
                    label: {
                        enabled: true,
                        formatter: (params) => {
                            const value = Math.abs(params.value as number);
                            return `-£${value}B`;
                        },
                    },
                },
                total: {
                    fillOpacity: 0.3,
                    label: {
                        enabled: true,
                        placement: 'inside-center',
                        insideStyle: { color: { ref: 'textColor' } },
                        formatter: (params) => {
                            const value = params.value as number;
                            return `£${value}B`;
                        },
                    },
                },
            },
            tooltip: {
                renderer: (params) => {
                    // Total and subtotal bars are synthetic and expose no user datum; their
                    // cumulative value is supplied via `totalValue` and the axis label via `itemId`.
                    if (params.itemType === 'total' || params.itemType === 'subtotal') {
                        const total = Number(params.totalValue ?? 0);
                        return {
                            heading: String(params.itemId),
                            data: [
                                {
                                    label: 'Amount',
                                    value: `${total < 0 ? '-' : ''}£${Math.abs(total)} billion`,
                                },
                            ],
                        };
                    }

                    const value = params.datum.amount;
                    return {
                        heading: params.datum.financials,
                        data: [
                            {
                                label: 'Amount',
                                value: `${value < 0 ? '-' : ''}£${Math.abs(value)} billion`,
                            },
                        ],
                    };
                },
            },
        },
    ],
    axes: {
        y: {
            type: 'category',
            bandHighlight: {
                enabled: true,
            },
        },
        x: {
            type: 'number',
            label: {
                formatter: (params) => {
                    const value = params.value as number;
                    return `${value < 0 ? '-' : ''}£${Math.abs(value)}B`;
                },
            },
            gridLine: {
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
        },
    },
};

AgCharts.create(options);
