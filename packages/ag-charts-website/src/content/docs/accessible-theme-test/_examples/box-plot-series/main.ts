import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    BoxPlotSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    BoxPlotSeriesModule,
    CategoryAxisModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    ContextMenuModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    theme: 'ag-accessible',
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
            yName: '2024 Salaries',
            xKey: 'department',
            minKey: 'min',
            q1Key: 'q1',
            medianKey: 'median',
            q3Key: 'q3',
            maxKey: 'max',
        },
        {
            type: 'box-plot',
            yName: '2025 Salaries',
            xKey: 'department',
            minKey: 'min2025',
            q1Key: 'q12025',
            medianKey: 'median2025',
            q3Key: 'q32025',
            maxKey: 'max2025',
        },
    ],
};

AgCharts.create(options);
