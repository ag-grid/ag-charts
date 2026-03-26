import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Quarterly Sales vs Target',
    },
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'target',
            yName: 'Target',
            grouped: false,
            fillOpacity: 0.3,
            cornerRadius: 3,
            highlight: {
                enabled: false,
            },
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'quarter',
            yKey: 'actual',
            yName: 'Actual',
            grouped: false,
            widthRatio: 0.5,
            cornerRadius: 6,
        },
    ],
};

AgCharts.create(options);
