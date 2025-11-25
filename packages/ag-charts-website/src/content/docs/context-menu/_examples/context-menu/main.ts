import {
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { ContextMenuModule } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    ZoomModule,
]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Sweaters made',
    },
    data: [
        {
            month: 'Jun',
            sweaters: 50,
            hats: 40,
        },
        {
            month: 'Jul',
            sweaters: 70,
            hats: 50,
        },
        {
            month: 'Aug',
            sweaters: 60,
            hats: 30,
        },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'sweaters',
            yName: 'Sweaters Made',
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'hats',
            yName: 'Hats Made',
        },
    ],
};

AgCharts.create(options);
