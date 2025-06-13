import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';

import { CurrencyConverter } from './currencyConverter';
import { TradeDatum, getData } from './data';

const myCurrencyConverter = new CurrencyConverter('EUR');

const options: AgChartOptions<TradeDatum, CurrencyConverter> = {
    container: document.getElementById('myChart'),
    context: myCurrencyConverter,
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
                    return {
                        title: datum.date.toDateString(),
                        content: `
                          Open: ${context.formatBothCurrencies(datum.open)}\n
                          High: ${context.formatBothCurrencies(datum.high)}\n
                          Low: ${context.formatBothCurrencies(datum.low)}\n
                          Close: ${context.formatBothCurrencies(datum.close)}`,
                    };
                },
            },
        },
    ],
    axes: [
        {
            type: 'time',
            position: 'bottom',
        },
        {
            type: 'number',
            position: 'left',
            label: {
                formatter: ({ value, context }) => {
                    return context.formatStockCurrency(value);
                },
            },
        },
    ],
};

AgCharts.create(options);
