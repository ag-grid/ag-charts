import {
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    ScatterSeriesModule,
} from 'ag-charts-community';
import { AgChartOptions, AgCharts, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { ErrorBarsModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CategoryAxisModule,
    CrosshairModule,
    ErrorBarsModule,
    LegendModule,
    NumberAxisModule,
    ScatterSeriesModule,
    ZoomModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Volume-Pressure Relationship with Confidence Intervals',
    },
    series: [
        {
            type: 'scatter',
            xKey: 'vol',
            yKey: 'pres',
            errorBar: {
                xLowerKey: 'volLower',
                xUpperKey: 'volUpper',
                yLowerKey: 'presLower',
                yUpperKey: 'presUpper',
                stroke: 'pink',
                strokeWidth: 2,
                cap: {
                    stroke: 'red', // otherwise inherits `pink` from whisker
                    strokeWidth: 5, // otherwise inherits `2` from whisker
                    length: 25,
                },
            },
        },
    ],
};

AgCharts.create(options);
