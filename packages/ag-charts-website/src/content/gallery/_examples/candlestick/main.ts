import { LegendModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts, CandlestickSeriesModule, OrdinalTimeAxisModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    CandlestickSeriesModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
]);
const dateFormatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

const priceFormatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

const volumeFormatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    compactDisplay: 'short',
});

const data = getData();
const avgVolume = data.reduce((sum, d) => sum + d.volume, 0) / data.length;

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    title: {
        text: 'NASDAQ 100 Index (^NDX)',
    },
    subtitle: {
        text: 'Daily Price Movement with 20 & 50 Day Moving Averages',
    },
    footnote: {
        text: 'Sep 11, 2023 - Mar 22, 2024 • Data: Historical Prices',
        fontStyle: 'italic',
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
            yName: 'Price ($)',
            item: {
                up: {
                    fillOpacity: 0.9,
                    strokeWidth: 1,
                },
                down: {
                    fillOpacity: 0.9,
                    strokeWidth: 1,
                },
            },
            tooltip: {
                range: 'nearest',
                renderer({ datum, xKey }: any) {
                    const change = datum.close - datum.open;
                    const dayChange = ((datum.close - datum.open) / datum.open) * 100;
                    const volumeClass = datum.volume > avgVolume ? 'high' : 'normal';
                    const changeClass = change >= 0 ? 'positive' : 'negative';

                    return [
                        `<div class="trading-tooltip">`,
                        `<div class="date-header">${dateFormatter.format(datum[xKey])}</div>`,
                        `<div class="price-section">`,
                        `<div class="price-row">`,
                        `<span class="label">Open:</span>`,
                        `<span class="value">${priceFormatter.format(datum.open)}</span>`,
                        `</div>`,
                        `<div class="price-row">`,
                        `<span class="label">High:</span>`,
                        `<span class="value">${priceFormatter.format(datum.high)}</span>`,
                        `</div>`,
                        `<div class="price-row">`,
                        `<span class="label">Low:</span>`,
                        `<span class="value">${priceFormatter.format(datum.low)}</span>`,
                        `</div>`,
                        `<div class="price-row">`,
                        `<span class="label">Close:</span>`,
                        `<span class="value">${priceFormatter.format(datum.close)}</span>`,
                        `</div>`,
                        `</div>`,
                        `<div class="change-section ${changeClass}">`,
                        `<span class="change-icon">${change >= 0 ? '▲' : '▼'}</span>`,
                        `<span class="change-value">${priceFormatter.format(Math.abs(change))}</span>`,
                        `<span class="change-percent">(${dayChange.toFixed(2)}%)</span>`,
                        `</div>`,
                        `<div class="volume-section">`,
                        `<span class="label">Volume:</span>`,
                        `<span class="value volume-${volumeClass}">${volumeFormatter.format(datum.volume)}</span>`,
                        `</div>`,
                        datum.sma20
                            ? `<div class="indicator-section">
                            <div class="indicator-row">
                                <span class="label">SMA 20:</span>
                                <span class="value">${priceFormatter.format(datum.sma20)}</span>
                            </div>
                            ${
                                datum.sma50
                                    ? `<div class="indicator-row">
                                <span class="label">SMA 50:</span>
                                <span class="value">${priceFormatter.format(datum.sma50)}</span>
                            </div>`
                                    : ''
                            }
                        </div>`
                            : '',
                        `</div>`,
                    ].join('');
                },
            },
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'sma20',
            yName: '20 Day SMA',
            strokeOpacity: 0.8,
            marker: {
                enabled: false,
            },
            tooltip: {
                enabled: false,
            },
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'sma50',
            yName: '50 Day SMA',
            strokeOpacity: 0.8,
            marker: {
                enabled: false,
            },
            tooltip: {
                enabled: false,
            },
        },
    ],
    axes: {
        x: {
            type: 'ordinal-time',
            position: 'bottom',
            interval: { step: 'month' },
            line: {
                enabled: false,
            },
            gridLine: {
                enabled: true,
                style: [
                    {
                        strokeWidth: 1,
                        fill: 'lightgray',
                        fillOpacity: 0.2,
                        lineDash: [2, 2],
                    },
                    { strokeWidth: 0 },
                ],
            },
        },
        y: {
            type: 'number',
            position: 'right',
            title: {
                text: 'Price ($)',
            },
            interval: { step: 500 },
        },
    },
    tooltip: {
        range: 'exact',
        position: {
            anchorTo: 'pointer',
            placement: ['top', 'bottom'],
        },
    },
    legend: {
        position: {
            placement: 'left-top',
            floating: true,
            xOffset: 20,
            yOffset: 20,
        },
        item: {
            paddingX: 16,
            paddingY: 8,
            marker: {
                shape: 'square',
                size: 12,
            },
        },
    },
    formatter: {
        x: (params) => {
            if (params.type !== 'date') return;
            if (params.value.getMonth() === 0) return params.value.toLocaleString('en-US', { year: 'numeric' });
            return params.value.toLocaleString('en-US', { month: 'short' });
        },
        y: '#{,.0f}',
    },
};

AgCharts.create(options);
