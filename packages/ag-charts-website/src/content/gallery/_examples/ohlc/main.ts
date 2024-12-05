import { AgChartOptions, AgCharts, time } from 'ag-charts-enterprise';

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
            interval: { step: time.month.every(1) },
            line: {
                enabled: false,
            },
            gridLine: {
                enabled: true,
            },
            label: {
                formatter: ({ value }) => {
                    const dateObject = new Date(value);
                    if (dateObject.getFullYear() === 2024 && dateObject.getMonth() === 0) {
                        return '2024';
                    }
                    return dateObject.toLocaleString('en-GB', {
                        month: 'short',
                    });
                },
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
            label: {
                formatter: ({ value }) => Number(value).toFixed(4),
            },
            crosshair: {
                label: {
                    format: `.4f`,
                },
            },
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
            type: 'top-left',
            xOffset: 10,
            yOffset: 55,
        },
    },
};
AgCharts.create(options);
