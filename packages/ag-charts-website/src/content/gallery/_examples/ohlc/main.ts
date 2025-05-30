import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { getData } from './data';

const numberFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
});

const volumeNumberFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

const options: AgChartOptions = {
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
                renderer({ openKey, lowKey, highKey, closeKey, datum }) {
                    return [
                        `<div class="status-bar">`,
                        `<div class="status-bar-row">`,
                        ...[openKey, lowKey, highKey, closeKey].map((key) => {
                            return [
                                `<span class="label">${key.slice(0, 1).toUpperCase()}</span>`,
                                `<span class="value">${numberFormatter.format(datum[key])}</span>`,
                            ].join('');
                        }),
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
