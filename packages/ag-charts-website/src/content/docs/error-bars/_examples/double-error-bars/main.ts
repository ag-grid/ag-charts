import { AgChartOptions, AgCharts, AgLineSeriesTooltipRendererParams } from 'ag-charts-enterprise';

import { getData } from './data';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Option Prices vs. Expiry with Confidence Intervals',
    },
    series: [
        {
            type: 'line',
            xKey: 'expiry',
            yKey: 'price',
            errorBar: {
                xLowerKey: 'expiryLo',
                xUpperKey: 'expiryHi',
                yLowerKey: 'priceLo',
                yUpperKey: 'priceHi',
            },
            tooltip: { renderer: customTooltipRenderer },
        },
    ],
    axes: [
        {
            type: 'number',
            position: 'bottom',
            title: {
                text: 'Expiry Date (Months)',
            },
        },
        {
            type: 'number',
            position: 'left',
            title: {
                text: 'Option Price (£)',
            },
        },
    ],
};

function customTooltipRenderer(params: AgLineSeriesTooltipRendererParams) {
    const { datum, xUpperKey, xLowerKey, yUpperKey, yLowerKey } = params;
    const expiryUpper = datum[xUpperKey!];
    const expiryLower = datum[xLowerKey!];
    const priceUpper = datum[yUpperKey!];
    const priceLower = datum[yLowerKey!];

    return {
        heading: undefined,
        data: [
            { label: 'Expiry', value: `${expiryLower} to ${expiryUpper} months` },
            { label: 'Price', value: `${priceLower} to ${priceUpper} pounds` },
        ],
    };
}

AgCharts.create(options);
