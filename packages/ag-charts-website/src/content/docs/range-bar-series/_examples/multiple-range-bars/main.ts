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
    RangeBarSeriesModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CategoryAxisModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    RangeBarSeriesModule,
    ContextMenuModule,
]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: `Digital Subscriptions`,
    },
    subtitle: {
        text: `In Thousands`,
    },
    series: [
        {
            type: 'range-bar',
            xKey: 'date',
            yLowKey: 'start',
            yHighKey: 'gain',
            xName: 'Month',
            yLowName: 'Start',
            yHighName: 'End',
            yName: 'Gained',
        },
        {
            type: 'range-bar',
            xKey: 'date',
            yLowKey: 'loss',
            yHighKey: 'gain',
            xName: 'Month',
            yLowName: 'End',
            yHighName: 'Start',
            yName: 'Lost',
        },
    ],
};

AgCharts.create(options);
