import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import {
    BarSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';
import { ErrorBarsModule } from 'ag-charts-enterprise';

import { getData } from './data';


ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, ErrorBarsModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Monthly Average Temperatures',
    },
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'temperature',
            errorBar: {
                yLowerKey: 'temperatureLower',
                yUpperKey: 'temperatureUpper',
            },
        },
    ],
};

AgCharts.create(options);
