import {
    AgCharts,
    AgPolarChartOptions,
    AngleCategoryAxisModule,
    ContextMenuModule,
    LegendModule,
    ModuleRegistry,
    RadialColumnSeriesModule,
    RadiusNumberAxisModule,
} from 'ag-charts-enterprise';

import { type RevenueData, getData } from './data';

ModuleRegistry.registerModules([
    AngleCategoryAxisModule,
    LegendModule,
    RadialColumnSeriesModule,
    RadiusNumberAxisModule,
]);
const options: AgPolarChartOptions<RevenueData> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Revenue by Product Category',
    },
    subtitle: {
        text: 'Quarterly Performance (Millions USD)',
    },
    formatter: {
        radius: ({ value }) => {
            if (typeof value === 'number') {
                return `$${value.toFixed(1)}M`;
            }
        },
    },
    series: [
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'software',
            radiusName: 'Software',
            stacked: true,
        },
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'hardware',
            radiusName: 'Hardware',
            stacked: true,
        },
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'services',
            radiusName: 'Services',
            stacked: true,
        },
    ],
    axes: {
        radius: {
            type: 'radius-number',
            innerRadiusRatio: 0.4,
            reverse: true,
            label: {
                enabled: false,
            },
        },
        angle: {
            type: 'angle-category',
            paddingInner: 0.2,
        },
    },
    legend: {
        item: {
            marker: {
                size: 16,
            },
        },
    },
};

AgCharts.create(options);
