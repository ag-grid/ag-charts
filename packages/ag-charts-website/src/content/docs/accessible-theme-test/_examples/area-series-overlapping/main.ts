import { AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { AreaSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([AreaSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    theme: 'ag-accessible',
    title: {
        text: 'Website Visits by Device',
    },
    subtitle: {
        text: 'In Thousands',
    },
    data: getData(),
    series: [
        {
            type: 'area',
            xKey: 'month',
            yKey: 'desktop',
            yName: 'Desktop',
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'mobile',
            yName: 'Mobile',
        },
        {
            type: 'area',
            xKey: 'month',
            yKey: 'tablet',
            yName: 'Tablet',
        },
    ],
};

AgCharts.create(options);
