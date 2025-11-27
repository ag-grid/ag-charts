import { ModuleRegistry } from 'ag-charts-community';
import {
    AgChartOptions,
    AgCharts,
    AngleCategoryAxisModule,
    NightingaleSeriesModule,
    RadiusNumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([NightingaleSeriesModule, RadiusNumberAxisModule, AngleCategoryAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Software Revenue',
    },
    subtitle: {
        text: 'Millions USD',
    },
    series: [
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'software',
            radiusName: 'Software',
            fillOpacity: 0.8,
        },
    ],
    axes: {
        radius: {
            type: 'radius-number',
            interval: { values: [1, 3, 5] },
            reverse: true,
            gridLine: {
                width: 2,
            },
            positionAngle: 90,
            label: {
                rotation: -90,
                spacing: 12,
                formatter: ({ value }) => `$${value}M`,
            },
            line: {
                enabled: true,
            },
        },
        angle: {
            type: 'angle-category',
            paddingInner: 0.1,
            gridLine: {
                enabled: true,
            },
            tick: {
                enabled: true,
            },
            label: {
                spacing: 5,
            },
        },
    },
};

AgCharts.create(options);
