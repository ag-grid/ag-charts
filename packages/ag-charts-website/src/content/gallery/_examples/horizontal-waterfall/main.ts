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
                        formatter: (params) => {
                            const value = params.value as number;
                            return `£${value}B`;
                        },
                    },
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
