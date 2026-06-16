import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    WaterfallSeriesModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CategoryAxisModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    WaterfallSeriesModule,
    ContextMenuModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'UK Government Budget',
    },
    subtitle: {
        text: 'All values in £ billions',
    },
    series: [
        {
            type: 'waterfall',
            xKey: 'financials',
            xName: 'Financials',
            yKey: 'amount',
            yName: 'Amount',
            totals: [
                { totalType: 'subtotal', index: 4, axisLabel: 'Total Revenue', itemId: 'total-revenue' },
                { totalType: 'subtotal', index: 9, axisLabel: 'Total Expenditure', itemId: 'total-expenditure' },
                { totalType: 'total', index: 9, axisLabel: 'Total Borrowing', itemId: 'total-borrowing' },
            ],
        },
    ],
};

AgCharts.create(options);
