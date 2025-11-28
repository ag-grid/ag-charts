import { ModuleRegistry } from 'ag-charts-community';
import {
    AgChartOptions,
    AgCharts,
    AngleNumberAxisModule,
    ContextMenuModule,
    RadialBarSeriesModule,
    RadiusCategoryAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AngleNumberAxisModule, RadialBarSeriesModule, RadiusCategoryAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Revenue by Product Category',
    },
    subtitle: {
        text: 'Millions USD',
    },
    formatter: {
        angle: ({ value }) => `$${typeof value === 'number' ? value.toFixed(1) : value}M`,
    },
    tooltip: {
        enabled: true,
        mode: 'shared',
    },
    series: [
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'software',
            angleName: 'Software',
        },
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'hardware',
            angleName: 'Hardware',
        },
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'services',
            angleName: 'Services',
        },
    ],
    axes: {
        radius: {
            type: 'radius-category',
            reverse: true,
            innerRadiusRatio: 0.1,
            paddingInner: 0.4,
            label: {
                enabled: true,
                color: 'black',
                fill: 'white',
                fillOpacity: 0.8,
                padding: {
                    top: 3,
                    left: 4,
                    right: 4,
                },
            },
        },
        angle: {
            type: 'angle-number',
            reverse: true,
            line: {
                enabled: false,
            },
            gridLine: {
                enabled: true,
                style: [{ lineDash: [2, 2] }],
            },
        },
    },
};

AgCharts.create(options);
