import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    ErrorBarsModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    CrosshairModule,
    ErrorBarsModule,
    LegendModule,
    NumberAxisModule,
    ContextMenuModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Monthly Dividends with 95% Confidence Intervals (%)',
    },
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'dividends',
            yName: 'Monthly Dividends (%)',
            errorBar: {
                yLowerKey: 'lowerCI',
                yUpperKey: 'upperCI',
            },
        },
    ],
};

AgCharts.create(options);
