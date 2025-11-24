import {
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';
import { AgChartOptions, AgCharts, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { ErrorBarsModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    CrosshairModule,
    ErrorBarsModule,
    LegendModule,
    NumberAxisModule,
    ZoomModule,
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
