import { CategoryAxisModule, LegendModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { RangeBarSeriesModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CategoryAxisModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    RangeBarSeriesModule,
    ZoomModule,
]);
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
            label: {
                padding: 10,
                formatter: ({ itemType, value }) => {
                    return `£${value.toFixed(0)}K ${itemType === 'low' ? '↓' : '↑'}`;
                },
            },
        },
    ],
};

AgCharts.create(options);
