import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import {
    BarSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';


ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);
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
