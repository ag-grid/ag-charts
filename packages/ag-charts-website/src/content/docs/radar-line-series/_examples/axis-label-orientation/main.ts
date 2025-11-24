import { LegendModule, ModuleRegistry } from 'ag-charts-community';
import { AgCharts, AgPolarChartOptions } from 'ag-charts-enterprise';
import { AngleCategoryAxisModule, RadarLineSeriesModule, RadiusNumberAxisModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AngleCategoryAxisModule, LegendModule, RadarLineSeriesModule, RadiusNumberAxisModule]);
const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'KPIs by Department',
    },
    series: [
        {
            type: 'radar-line',
            angleKey: 'department',
            radiusKey: 'quality',
            radiusName: 'Quality',
        },
        {
            type: 'radar-line',
            angleKey: 'department',
            radiusKey: 'efficiency',
            radiusName: 'Efficiency',
        },
    ],
    axes: {
        angle: {
            type: 'angle-category',
            label: {
                orientation: 'parallel',
            },
        },
        radius: {
            type: 'radius-number',
        },
    },
};

AgCharts.create(options);
