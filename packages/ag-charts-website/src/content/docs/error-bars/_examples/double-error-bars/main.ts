import { LegendModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import {
    AgChartOptions,
    AgCharts,
    AgLineSeriesTooltipRendererParams,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    ErrorBarsModule,
} from 'ag-charts-enterprise';

import { DataType } from './data';
import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    ErrorBarsModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    ContextMenuModule,
]);
const options: AgChartOptions<DataType> = {
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
    axes: {
        x: {
            type: 'number',
            position: 'bottom',
            title: {
                text: 'Expiry Date (Months)',
            },
        },
        y: {
            type: 'number',
            position: 'left',
            title: {
                text: 'Option Price (£)',
            },
        },
    },
};

function customTooltipRenderer({ datum }: AgLineSeriesTooltipRendererParams<DataType>) {
    return {
        heading: '',
        data: [
            { label: 'Expiry', value: `${datum.expiryLo} to ${datum.expiryHi} months` },
            { label: 'Price', value: `${datum.priceLo} to ${datum.priceHi} pounds` },
        ],
    };
}

AgCharts.create(options);
