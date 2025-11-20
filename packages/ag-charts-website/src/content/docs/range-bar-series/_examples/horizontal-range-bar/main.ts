import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { CategoryAxisModule, NumberAxisModule, ModuleRegistry } from 'ag-charts-community';
import { RangeBarSeriesModule } from 'ag-charts-enterprise';

import { getData } from './data';


ModuleRegistry.registerModules([CategoryAxisModule, NumberAxisModule, RangeBarSeriesModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Salary Ranges By Department',
    },
    subtitle: {
        text: 'Low and High Salary Brackets Across Various Departments (in thousands)',
    },
    series: [
        {
            type: 'range-bar',
            direction: 'horizontal',
            xKey: 'department',
            yLowKey: 'low',
            yHighKey: 'high',
        },
    ],
};

AgCharts.create(options);
