import { AgChartOptions, AgEnterpriseCharts, AgLineSeriesTooltipRendererParams } from 'ag-charts-enterprise';

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

    const content = `
        <ul style="margin-left: -25px;">
            <li><b>Expiry</b>: ${expiryLower} - ${expiryUpper} months</li>
            <li><b>Price</b>: £${priceLower} - £${priceUpper}</li>
        </ul>
    `;

    return { content };
}

AgEnterpriseCharts.create(options);
