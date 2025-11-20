import { CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
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
            xKey: 'department',
            yLowKey: 'low',
            yHighKey: 'high',
        },
    ],
};

AgCharts.create(options);
