import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';

import type { CurrencyConverter } from './currencyConverter';
import { Currency, makeCurrencyConverter } from './currencyConverter';
import { TradeDatum, getData } from './data';

const options: AgCartesianChartOptions<TradeDatum, CurrencyConverter> = {
    container: document.getElementById('myChart'),
    context: makeCurrencyConverter('EUR'),
    title: {
        text: 'Stock Prices',
    },
    data: getData(),
    series: [
        {
            type: 'candlestick',
            xKey: 'date',
            openKey: 'open',
            highKey: 'high',
            lowKey: 'low',
            closeKey: 'close',
            tooltip: {
                renderer: ({ datum, context }) => {
                    if (context == null) return {};
                    return {
                        title: datum.date.toDateString(),
                        data: [
                            { label: 'Open', value: context.formatBothCurrencies(datum.open) },
                            { label: 'High', value: context.formatBothCurrencies(datum.high) },
                            { label: 'Low', value: context.formatBothCurrencies(datum.low) },
                            { label: 'Close', value: context.formatBothCurrencies(datum.close) },
                        ],
                    };
                },
            },
        },
    ],
    axes: {
        x: {
            type: 'time',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
            label: {
                formatter: ({ value, context }) => {
                    return context?.formatUserCurrency(value);
                },
            },
        },
    },
    contextMenu: {
        items: [
            {
                showOn: 'series-node',
                label: 'Log as USD',
                action: ({ datum, context }) => console.log(context?.formatLog(datum, 'USD')),
            },
            {
                showOn: 'series-node',
                label: 'Log as EUR',
                action: ({ datum, context }) => console.log(context?.formatLog(datum, 'EUR')),
            },
            {
                showOn: 'series-node',
                label: 'Log as GBP',
                action: ({ datum, context }) => console.log(context?.formatLog(datum, 'GBP')),
            },
            {
                showOn: 'series-node',
                label: 'Log as JPY',
                action: ({ datum, context }) => console.log(context?.formatLog(datum, 'JPY')),
            },
            {
                showOn: 'series-node',
                label: 'Log as INR',
                action: ({ datum, context }) => console.log(context?.formatLog(datum, 'INR')),
            },
        ],
    },
};

const chart = AgCharts.create(options);

function onMySelectChange(value: Currency) {
    options.context = makeCurrencyConverter(value);
    chart.update(options);
}
