import {
    AgCartesianChartOptions,
    AgCharts,
    CrossLinesModule,
    CrosshairModule,
    HlcSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    OrdinalTimeAxisModule,
} from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([
    CrosshairModule,
    CrossLinesModule,
    HlcSeriesModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
]);
const numberFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
});

const data = getData();
const averageClose = data.reduce((sum, { close }) => sum + close, 0) / data.length;

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'USD/GBP',
    },
    subtitle: {
        text: 'Foreign Exchange Rate',
    },
    footnote: {
        text: 'Apr 25, 2023 - Apr 25, 2024',
    },
    series: [
        {
            type: 'hlc',
            xKey: 'date',
            xName: 'Date',
            highKey: 'high',
            highName: 'High',
            lowKey: 'low',
            lowName: 'Low',
            closeKey: 'close',
            closeName: 'Close',
            tooltip: {
                renderer({ datum, xKey }) {
                    return {
                        heading: (datum[xKey] as Date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        }),
                        title: `Range ${numberFormatter.format(datum.high - datum.low)}`,
                        data: [
                            { label: 'High', value: `£${numberFormatter.format(datum.high)}` },
                            { label: 'Low', value: `£${numberFormatter.format(datum.low)}` },
                            { label: 'Close', value: `£${numberFormatter.format(datum.close)}` },
                        ],
                    };
                },
            },
        },
    ],
    axes: {
        x: {
            type: 'ordinal-time',
            line: {
                enabled: false,
            },
            gridLine: {
                enabled: true,
                style: [
                    {
                        lineDash: [2, 2],
                    },
                ],
            },
            parentLevel: {
                enabled: true,
            },
            crosshair: {
                label: {
                    format: '%d %b %y',
                },
            },
        },
        y: {
            type: 'number',
            position: 'right',
            interval: { step: 0.01 },
            crossLines: [
                {
                    type: 'line',
                    value: averageClose,
                    lineDash: [6, 3],
                    strokeWidth: 1.5,
                    label: {
                        text: `Avg: ${numberFormatter.format(averageClose)}`,
                        placement: 'top-left',
                        padding: 4,
                        fill: { ref: 'backgroundColor' },
                        fillOpacity: 0.8,
                    },
                },
            ],
            gridLine: {
                enabled: true,
                style: [
                    {
                        lineDash: [1, 3],
                    },
                ],
            },
        },
    },
    tooltip: {
        position: {
            anchorTo: 'chart',
            placement: 'top-left',
        },
    },
    formatter: {
        y: ({ value }) => `£${numberFormatter.format(Number(value))}`,
    },
};
AgCharts.create(options);
