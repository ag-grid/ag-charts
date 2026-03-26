import {
    AgChartOptions,
    AgCharts,
    BandHighlightModule,
    CategoryAxisModule,
    ContextMenuModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    WaterfallSeriesModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    BandHighlightModule,
    LegendModule,
    NumberAxisModule,
    WaterfallSeriesModule,
    CategoryAxisModule,
]);
const options: AgChartOptions<ReturnType<typeof getData>[0]> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'FTSE 100 Index Daily Performance',
    },
    subtitle: {
        text: 'October 2023 Trading Days',
    },
    footnote: {
        text: 'Source: London Stock Exchange | Monthly Net Change: -4.12%',
    },
    series: [
        {
            type: 'waterfall',
            xKey: 'date',
            xName: 'Trading Date',
            yKey: 'percentageChange',
            yName: 'Daily Change %',
            line: {
                lineDash: [5, 3],
                strokeWidth: 1.5,
            },
            totals: [
                {
                    totalType: 'total',
                    index: 10,
                    axisLabel: 'Monthly Net',
                },
            ],
            item: {
                positive: {
                    name: 'Gain',
                    strokeWidth: 2,
                    fillOpacity: 0.9,
                    label: {
                        enabled: true,
                        formatter: ({ value }) => (value ? `+${value.toFixed(1)}%` : ''),
                    },
                },
                negative: {
                    name: 'Loss',
                    strokeWidth: 2,
                    fillOpacity: 0.9,
                    label: {
                        enabled: true,
                        formatter: ({ value }) => (value ? `${value.toFixed(1)}%` : ''),
                    },
                },
                total: {
                    name: 'Net Total',
                    strokeWidth: 2.5,
                    fillOpacity: 0.95,
                    label: {
                        enabled: true,
                        placement: 'inside-center',
                        formatter: ({ value }) => (value ? `${value.toFixed(2)}%` : ''),
                    },
                },
            },
        },
    ],
    axes: {
        y: {
            position: 'right',
            type: 'number',
            title: {
                text: 'Daily Change (%)',
            },
            gridLine: {
                style: [
                    {
                        strokeWidth: 1,
                        lineDash: [3, 3],
                    },
                    {
                        strokeWidth: 0,
                    },
                ],
            },
            crossLines: [
                {
                    type: 'line',
                    value: 0,
                    strokeWidth: 0,
                    lineDash: [6, 4],
                    label: {
                        text: 'Break Even',
                        position: 'bottom',
                    },
                },
                {
                    type: 'range',
                    range: [-2, 0],
                    fillOpacity: 0.05,
                    label: {
                        position: 'inside-bottom',
                        text: 'Acceptable Loss Zone',
                    },
                },
                {
                    type: 'range',
                    range: [0, 1],
                    fillOpacity: 0.05,
                    label: {
                        position: 'inside-top',
                        text: 'Gain Zone',
                    },
                },
            ],
            label: {
                formatter: ({ value }) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`,
            },
        },
        x: {
            type: 'category',
            bandHighlight: {
                enabled: true,
            },
        },
    },
    legend: {
        position: {
            floating: true,
            placement: 'top-right',
            xOffset: -20,
            yOffset: 20,
        },
        maxWidth: 300,
    },
    formatter: {
        y: '#{~f}%',
        x: ({ value }) => {
            if (value instanceof Date) {
                return value.toLocaleDateString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                });
            }

            return String(value);
        },
    },
};

AgCharts.create(options);
