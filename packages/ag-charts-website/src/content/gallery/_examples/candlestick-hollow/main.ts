import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { LineSeriesModule, NumberAxisModule, ModuleRegistry } from 'ag-charts-community';
import {
    BandHighlightModule,
    CandlestickSeriesModule,
    CrosshairModule,
    OrdinalTimeAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { getData } from './data';


ModuleRegistry.registerModules([BandHighlightModule, CandlestickSeriesModule, CrosshairModule, LineSeriesModule, NumberAxisModule, OrdinalTimeAxisModule, ZoomModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Bitcoin USD',
    },
    subtitle: {
        text: '(BTC-USD)',
    },
    footnote: {
        text: '2014 - 2024',
    },
    series: [
        {
            type: 'candlestick',
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
            item: {
                up: {
                    fill: 'transparent',
                    stroke: '#2b5c95',
                    strokeWidth: 1.5,
                },
                down: {
                    fill: '#5090dc',
                    stroke: '#2b5c95',
                    strokeWidth: 1.5,
                },
            },
            tooltip: {
                renderer: ({ datum, xKey, openKey, closeKey, highKey, lowKey }) => {
                    const date = new Date(datum[xKey]);
                    const open = datum[openKey];
                    const close = datum[closeKey];
                    const high = datum[highKey];
                    const low = datum[lowKey];
                    const change = close - open;
                    const changePercent = (change / open) * 100;

                    return {
                        heading: 'Price Data',
                        title: date.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                        }),
                        data: [
                            { label: 'Open', value: `$${open.toLocaleString()}` },
                            { label: 'High', value: `$${high.toLocaleString()}` },
                            { label: 'Low', value: `$${low.toLocaleString()}` },
                            { label: 'Close', value: `$${close.toLocaleString()}` },
                            {
                                label: 'Change',
                                value: `${change >= 0 ? '+' : ''}$${change.toFixed(0)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(1)}%)`,
                            },
                        ],
                    };
                },
            },
        },
    ],
    zoom: {
        enabled: true,
    },
    axes: {
        x: {
            type: 'ordinal-time',
            position: 'bottom',
            interval: { step: 'year' },
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
                ],
            },
            crosshair: {
                enabled: true,
                strokeWidth: 0,
                label: {
                    enabled: true,
                },
            },
            bandHighlight: {
                enabled: true,
            },
        },
        y: {
            type: 'number',
            position: 'right',
            interval: { step: 10000 },
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
            crosshair: {
                enabled: true,
                label: {
                    enabled: true,
                },
            },
            crossLines: [
                {
                    type: 'line',
                    value: 20000,
                    strokeWidth: 1,
                    lineDash: [5, 5],
                    label: {
                        text: '$20K',
                    },
                },
                {
                    type: 'line',
                    value: 60000,
                    strokeWidth: 1,
                    lineDash: [5, 5],
                    label: {
                        text: '$60K',
                    },
                },
            ],
        },
    },
    tooltip: {
        position: {
            anchorTo: 'pointer',
            placement: ['right', 'left', 'top', 'bottom'],
            xOffset: 20,
            yOffset: -20,
        },
    },
    formatter: {
        y: '$#{,.0f}',
    },
};
AgCharts.create(options);
