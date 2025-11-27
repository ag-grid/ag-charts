import { ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import {
    AgCartesianChartOptions,
    AgCharts,
    ContextMenuModule,
    CrosshairModule,
    OhlcSeriesModule,
    OrdinalTimeAxisModule,
} from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([NumberAxisModule, OhlcSeriesModule, OrdinalTimeAxisModule, CrosshairModule]);
const numberFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
});

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
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
            type: 'ohlc',
            xKey: 'date',
            xName: 'Date',
            lowKey: 'low',
            lowName: 'Low',
            highKey: 'high',
            highName: 'High',
            openKey: 'open',
            openName: 'Open',
            closeKey: 'close',
            closeName: 'Close',
            tooltip: {
                renderer({ datum, xKey }) {
                    const change = datum.close - datum.open;
                    const changePercent = (change / datum.open) * 100;
                    const changeSymbol = change >= 0 ? '▲' : '▼';

                    return {
                        heading: (datum[xKey] as Date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                        }),
                        title: `${changeSymbol} ${numberFormatter.format(Math.abs(change))} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`,
                        data: [
                            { label: 'Open', value: `£${numberFormatter.format(datum.open)}` },
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
            position: 'bottom',
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
                    value: 0.8016,
                    lineDash: [6, 3],
                    strokeWidth: 1.5,
                    label: {
                        text: 'Avg: 0.8016',
                        position: 'top-left',
                        padding: 4,
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
        y: ({ value }) => `£${Number(value).toFixed(3)}`,
    },
};
AgCharts.create(options);
