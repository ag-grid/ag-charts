import { AgCharts, AgSparklineOptions, LegendModule } from 'ag-charts-community';
import {
    BarSeriesModule,
    CategoryAxisModule,
    ModuleRegistry,
    NumberAxisModule,
    TimeAxisModule,
} from 'ag-charts-community';

import { data } from './data';

ModuleRegistry.registerModules([BarSeriesModule, LegendModule, CategoryAxisModule, NumberAxisModule, TimeAxisModule]);

const options: AgSparklineOptions = {
    container: document.getElementById('myChart'),
    width: 400,
    height: 50,
    data: data,
    type: 'bar',
    xKey: 'date',
    yKey: 'price',
    fill: '#5C6BC0',
    cornerRadius: 3,
};

AgCharts.__createSparkline(options);
