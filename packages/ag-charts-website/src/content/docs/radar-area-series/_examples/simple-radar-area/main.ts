import { ModuleRegistry } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { AngleCategoryAxisModule, RadarAreaSeriesModule, RadiusNumberAxisModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AngleCategoryAxisModule, RadarAreaSeriesModule, RadiusNumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'KPIs by Department',
    },
    series: [
        {
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'quality',
            radiusName: 'Quality',
        },
        {
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'efficiency',
            radiusName: 'Efficiency',
        },
    ],
};

AgCharts.create(options);
