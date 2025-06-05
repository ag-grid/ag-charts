import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const numberFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const volumeNumberFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'NASDAQ 100 (^NDX)',
    },
    subtitle: {
        text: 'Nasdaq GIDS - Nasdaq GIDS Historical Prices. Currency in USD',
        spacing: 50,
    },
    footnote: {
        text: 'Sep 11, 2023 - Mar 22, 2024',
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
            tooltip: {
                renderer({ datum }) {
                    return [
                        `<div class="status-bar">`,
                        `<div class="status-bar-row">`,
                        `<span class="label">O</span>`,
                        `<span class="value">${numberFormatter.format(datum.open)}</span>`,
                        `<span class="label">H</span>`,
                        `<span class="value">${numberFormatter.format(datum.high)}</span>`,
                        `<span class="label">L</span>`,
                        `<span class="value">${numberFormatter.format(datum.low)}</span>`,
                        `<span class="label">C</span>`,
                        `<span class="value">${numberFormatter.format(datum.close)}</span>`,
                        `</div>`,
                        `<div class="status-bar-row">`,
                        `<span class="label">Volume</span>`,
                        `<span class="value">${volumeNumberFormatter.format(datum.volume)}</span>`,
                        `</div>`,
                        `</div>`,
                    ].join('');
                },
            },
        },
    ],
    zoom: {
        enabled: true,
    },
    axes: [
        {
            type: 'ordinal-time',
            position: 'bottom',
            line: {
                enabled: false,
            },
            parentLevel: {
                enabled: true,
            },
            crossLines: [
                {
                    type: 'range',
                    range: [new Date(2023, 9, 1), new Date(2023, 10, 1)],
                    strokeWidth: 0,
                    fillOpacity: 0.05,
                },
                {
                    type: 'range',
                    range: [new Date(2023, 11, 1), new Date(2024, 0, 1)],
                    strokeWidth: 0,
                    fillOpacity: 0.05,
                },
                {
                    type: 'range',
                    range: [new Date(2024, 1, 1), new Date(2024, 2, 1)],
                    strokeWidth: 0,
                    fillOpacity: 0.05,
                },
            ],
        },
        {
            type: 'number',
            position: 'right',
            interval: { step: 500 },
        },
    ],
    tooltip: {
        position: {
            anchorTo: 'chart',
            placement: 'top-left',
            xOffset: 10,
            yOffset: 60,
        },
    },
    formatter: {
        y: '#{,.0f}',
    },
};
AgCharts.create(options);
