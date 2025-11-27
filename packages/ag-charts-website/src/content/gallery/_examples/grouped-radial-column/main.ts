import { LegendModule, ModuleRegistry } from 'ag-charts-community';
import {
    AgCharts,
    AgPolarChartOptions,
    AngleCategoryAxisModule,
    RadialColumnSeriesModule,
    RadiusNumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AngleCategoryAxisModule,
    LegendModule,
    RadialColumnSeriesModule,
    RadiusNumberAxisModule,
]);
const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    formatter: {
        radius: ({ value }) => `$${(typeof value === 'number' ? value : Number(value)).toFixed(2)}M`,
    },
    title: {
        text: 'Quarterly Revenue by Product Category',
    },
    subtitle: {
        text: 'Q1 2022 - Q4 2023 (Millions USD)',
        spacing: 12,
    },
    theme: {
        overrides: {
            'radial-column': {
                series: {
                    strokeWidth: 1,
                    fillOpacity: 0.85,
                },
            },
        },
    },
    series: [
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'software',
            radiusName: 'Software',
        },
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'hardware',
            radiusName: 'Hardware',
        },
        {
            type: 'radial-column',
            angleKey: 'quarter',
            radiusKey: 'services',
            radiusName: 'Services',
        },
    ],
    axes: {
        radius: {
            type: 'radius-number',
            innerRadiusRatio: 0.4,
            label: {
                enabled: false,
            },
        },
        angle: {
            type: 'angle-category',
            groupPaddingInner: 0.3,
            paddingInner: 0.3,
        },
    },
    legend: {
        spacing: 40,
        item: {
            marker: {
                size: 16,
                strokeWidth: 1.5,
            },
        },
    },
};

AgCharts.create(options);
