import { AgChartOptions, AgCharts, time } from 'ag-charts-enterprise';

import { getData } from './data';

const numberFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const volumeNumberFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
});

const options: AgChartOptions = {
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
            interval: { step: time.month.every(1) },
            line: {
                enabled: false,
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
            crosshair: {
                label: {
                    format: '%d %b %y',
                },
            },
        },
        {
            type: 'number',
            position: 'right',
            interval: { step: 500 },
            label: {
                formatter: ({ value }) => Number(value).toLocaleString(),
            },
            crosshair: {
                label: {
                    format: `,f`,
                },
            },
        },
    ],
    tooltip: {
        position: {
            type: 'top-left',
            xOffset: 10,
            yOffset: 60,
        },
    },
};
AgCharts.create(options);
