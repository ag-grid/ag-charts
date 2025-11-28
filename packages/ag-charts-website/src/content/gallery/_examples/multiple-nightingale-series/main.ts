import { ModuleRegistry } from 'ag-charts-community';
import {
    AgCharts,
    AgPolarChartOptions,
    AngleCategoryAxisModule,
    ContextMenuModule,
    NightingaleSeriesModule,
    RadiusNumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AngleCategoryAxisModule, NightingaleSeriesModule, RadiusNumberAxisModule]);
const options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Revenue by Product Category',
    },
    subtitle: {
        text: 'Quarterly Performance (Millions USD)',
    },
    formatter: {
        radius: ({ value }) => `$${Number(value).toFixed(0)}M`,
    },
    theme: {
        overrides: {
            nightingale: {
                series: {
                    fillOpacity: 0.9,
                    strokeWidth: 1.5,
                    highlight: {
                        highlightedItem: {
                            strokeWidth: 2.5,
                        },
                    },
                },
            },
        },
    },
    series: [
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'software',
            radiusName: 'Software',
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'hardware',
            radiusName: 'Hardware',
        },
        {
            type: 'nightingale',
            angleKey: 'quarter',
            radiusKey: 'services',
            radiusName: 'Services',
        },
    ],
    axes: {
        radius: {
            type: 'radius-number',
            innerRadiusRatio: 0.15,
            interval: {
                step: 2,
            },
            gridLine: {
                style: [{ strokeWidth: 1, lineDash: [2, 2] }, { strokeWidth: 0 }],
            },
            min: 0,
            max: 12,
            nice: false,
            crossLines: [
                {
                    type: 'range',
                    range: [10, 12],
                    strokeWidth: 0,
                    fillOpacity: 0.05,
                },
                {
                    type: 'range',
                    range: [8, 6],
                    strokeWidth: 0,
                    fillOpacity: 0.05,
                },
                {
                    type: 'range',
                    range: [4, 2],
                    strokeWidth: 0,
                    fillOpacity: 0.05,
                },
                {
                    type: 'line',
                    value: 8,
                    label: {
                        text: 'Target: $8M',
                        positionAngle: 180,
                    },
                    strokeWidth: 2,
                    lineDash: [5, 3],
                },
            ],
        },
        angle: {
            type: 'angle-category',
            paddingInner: 0.25,
            line: {
                enabled: false,
            },
        },
    },
};

AgCharts.create(options);
