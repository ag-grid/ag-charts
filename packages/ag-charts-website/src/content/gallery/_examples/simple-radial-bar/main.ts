import {
    AgCharts,
    AgPolarChartOptions,
    AngleNumberAxisModule,
    ContextMenuModule,
    ModuleRegistry,
    RadialBarSeriesModule,
    RadiusCategoryAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AngleNumberAxisModule, RadialBarSeriesModule, RadiusCategoryAxisModule]);
const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Services Revenue',
    },
    subtitle: {
        text: 'Millions USD',
    },
    formatter: {
        angle: ({ value }) => `$${typeof value === 'number' ? value.toFixed(1) : value}M`,
    },
    series: [
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'services',
            angleName: 'Services',
            fill: {
                type: 'gradient',
            },
            tooltip: {
                renderer: ({ datum, angleName }) => ({
                    heading: datum.quarter,
                    title: angleName || 'Services',
                    data: [
                        {
                            label: 'Revenue',
                            value: `$${datum.services.toFixed(1)}M`,
                        },
                    ],
                }),
            },
        },
    ],
    axes: {
        radius: {
            type: 'radius-category',
            innerRadiusRatio: 0,
            paddingOuter: 0.2,
            gridLine: {
                enabled: false,
            },
        },
        angle: {
            type: 'angle-number',
            endAngle: 270,
            interval: {
                step: 0.2,
            },
            gridLine: {
                enabled: true,
            },
        },
    },
};
AgCharts.create(options);
