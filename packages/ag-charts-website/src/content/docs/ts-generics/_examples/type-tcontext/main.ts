import { AgChartOptions, AgCharts } from 'ag-charts-community';

import { TradeDatum, getData } from './data';

type CurrentConverter = never;

const USD_TO_EUR = 0.94;

function formatCurrencyUSDandEUR(value: number): string {
    const usd = `$${value.toFixed(2)}`;
    const eur = `€${(value * USD_TO_EUR).toFixed(2)}`;
    return `${usd} (${eur})`;
}

const options: AgChartOptions<TradeDatum, CurrentConverter> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Stock Prices in USD',
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
                renderer: ({ datum }) => {
                    return {
                        title: datum.date.toDateString(),
                        content: `
                          Open: ${formatCurrencyUSDandEUR(datum.open)}\n
                          High: ${formatCurrencyUSDandEUR(datum.high)}\n
                          Low: ${formatCurrencyUSDandEUR(datum.low)}\n
                          Close: ${formatCurrencyUSDandEUR(datum.close)}`,
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
                formatter: ({ value }) => formatCurrencyUSDandEUR(value),
            },
        },
    ],
};

AgCharts.create(options);
