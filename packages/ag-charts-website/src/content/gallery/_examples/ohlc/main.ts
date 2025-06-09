import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { DataType, getData } from './data';

const numberFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
});

const volumeNumberFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'USD/GBP',
    },
    subtitle: {
        text: 'CCY - CCY Price in GBP',
        spacing: 20,
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
                renderer({ datum }) {
                    return [
                        `<div class="status-bar">`,
                        `<div class="status-bar-row">`,
                        `<span class="label">O</span><span class="value">${numberFormatter.format(datum.open)}</span>`,
                        `<span class="label">L</span><span class="value">${numberFormatter.format(datum.low)}</span>`,
                        `<span class="label">H</span><span class="value">${numberFormatter.format(datum.high)}</span>`,
                        `<span class="label">C</span><span class="value">${numberFormatter.format(datum.close)}</span>`,
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
            gridLine: {
                enabled: true,
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
        {
            type: 'number',
            position: 'right',
            interval: { step: 0.01 },
            crossLines: [
                {
                    type: 'line',
                    value: 0.8016,
                    lineDash: [4, 3],
                    stroke: 'red',
                },
            ],
        },
    ],
    tooltip: {
        position: {
            anchorTo: 'chart',
            placement: 'top-left',
            xOffset: 10,
            yOffset: 55,
        },
    },
    formatter: {
        y: '#{,.4f}',
    },
};
AgCharts.create(options);
