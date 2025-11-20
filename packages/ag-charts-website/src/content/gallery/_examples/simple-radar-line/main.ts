import { LegendModule, ModuleRegistry } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { AngleCategoryAxisModule, RadarLineSeriesModule, RadiusNumberAxisModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AngleCategoryAxisModule, LegendModule, RadarLineSeriesModule, RadiusNumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Department Performance Metrics',
    },
    subtitle: {
        text: 'Quality, Efficiency & Customer Satisfaction Scores (Q4 2024)',
    },
    // Root formatter for consistent percentage display
    formatter: {
        radius: ({ value }) => `${value}%`,
    },
    series: [
        {
            type: 'radar-line',
            angleKey: 'department',
            radiusKey: 'quality',
            radiusName: 'Quality',
            lineDash: [4],
            strokeWidth: 1,
        },
        {
            type: 'radar-line',
            angleKey: 'department',
            radiusKey: 'efficiency',
            radiusName: 'Efficiency',
            lineDash: [4],
            strokeWidth: 1,
        },
        {
            type: 'radar-line',
            angleKey: 'department',
            radiusKey: 'customerSatisfaction',
            radiusName: 'Customer Satisfaction',
            strokeWidth: 1,
            marker: {
                enabled: false,
            },
        },
    ],
    axes: {
        angle: {
            type: 'angle-category',
        },
        radius: {
            type: 'radius-number',
            label: {
                enabled: false,
            },
        },
    },
    legend: {
        enabled: true,
        position: {
            placement: 'right-bottom',
            floating: true,
            xOffset: -20,
            yOffset: -20,
        },
        item: {
            line: {
                strokeWidth: 2,
            },
            marker: {
                size: 0,
            },
        },
    },
    tooltip: {
        enabled: true,
        showArrow: false,
    },
};

AgCharts.create(options);
