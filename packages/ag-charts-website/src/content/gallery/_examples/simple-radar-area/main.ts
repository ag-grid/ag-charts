import { ModuleRegistry } from 'ag-charts-community';
import { AgCharts, AgPolarChartOptions } from 'ag-charts-enterprise';
import { AngleCategoryAxisModule, RadarAreaSeriesModule, RadiusNumberAxisModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AngleCategoryAxisModule, RadarAreaSeriesModule, RadiusNumberAxisModule]);
const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'KPIs by Department',
    },
    // Root-level formatter for consistency across all elements
    formatter: {
        radius: ({ value }) => `${value}%`,
    },
    tooltip: {
        position: {
            placement: ['top', 'bottom'],
        },
    },
    series: [
        {
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'quality',
            radiusName: 'Quality',
            fillOpacity: 0.3,
        },
        {
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'efficiency',
            radiusName: 'Efficiency',
            fillOpacity: 0.3,
        },
        {
            type: 'radar-area',
            angleKey: 'department',
            radiusKey: 'revenueGrowth',
            radiusName: 'Revenue Growth',
            fillOpacity: 0.3,
        },
    ],
    axes: {
        angle: {
            type: 'angle-category',
            gridLine: {
                enabled: true,
            },
            line: {
                enabled: false,
            },
        },
        radius: {
            type: 'radius-number',
        },
    },
};

AgCharts.create(options);
