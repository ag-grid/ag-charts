import { CategoryAxisModule, LegendModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { BoxPlotSeriesModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    BoxPlotSeriesModule,
    CategoryAxisModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    ZoomModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'HR Analytics',
    },
    subtitle: {
        text: 'Salary Distribution by Role',
    },
    data: getData(),
    series: [
        {
            type: 'box-plot',
            direction: 'horizontal',
            yName: 'Employee Salaries',
            xKey: 'role',
            xName: 'Role',
            minKey: 'min',
            minName: 'Min',
            q1Key: 'q1',
            q1Name: 'Q1',
            medianKey: 'median',
            medianName: 'Median',
            q3Key: 'q3',
            q3Name: 'Q3',
            maxKey: 'max',
            maxName: 'Max',
        },
    ],
};

AgCharts.create(options);
