import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    SelectionModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule, SelectionModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Quarterly Revenue' },
    selection: {
        enabled: true,
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'revenue',
            yName: 'Revenue ($m)',
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
};

AgCharts.create(options);
