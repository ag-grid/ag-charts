import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { CategoryAxisModule, NumberAxisModule, ModuleRegistry } from 'ag-charts-community';
import { BoxPlotSeriesModule } from 'ag-charts-enterprise';

import { getData } from './data';


ModuleRegistry.registerModules([BoxPlotSeriesModule, CategoryAxisModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'HR Analytics',
    },
    subtitle: {
        text: 'Salary Distribution by Department',
    },
    data: getData(),
    series: [
        {
            type: 'box-plot',
            yName: 'Employee Salaries',
            xKey: 'department',
            minKey: 'min',
            q1Key: 'q1',
            medianKey: 'median',
            q3Key: 'q3',
            maxKey: 'max',
        },
    ],
};

AgCharts.create(options);
