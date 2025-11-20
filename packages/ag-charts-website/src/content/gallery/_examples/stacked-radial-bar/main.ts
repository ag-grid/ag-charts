import { ModuleRegistry } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { AngleNumberAxisModule, RadialBarSeriesModule, RadiusCategoryAxisModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AngleNumberAxisModule, RadialBarSeriesModule, RadiusCategoryAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Quarterly Revenue by Product Category',
    },
    subtitle: {
        text: 'FY 2023 Performance (Millions USD)',
    },
    series: [
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'software',
            angleName: 'Software',
            stacked: true,
            strokeWidth: 1,
        },
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'hardware',
            angleName: 'Hardware',
            stacked: true,
            strokeWidth: 1,
        },
        {
            type: 'radial-bar',
            radiusKey: 'quarter',
            angleKey: 'services',
            angleName: 'Services',
            stacked: true,
            strokeWidth: 1,
        },
    ],
    axes: {
        radius: {
            type: 'radius-category',
            innerRadiusRatio: 0.1,
            paddingInner: 0.2,
        },
        angle: {
            type: 'angle-number',
            line: {
                enabled: false,
            },
            gridLine: {
                enabled: true,
                style: [
                    {
                        lineDash: [2, 2],
                    },
                ],
            },
            label: {
                enabled: false,
            },
        },
    },
    formatter: {
        angle: ({ value }) => `$${value}M`,
    },
};

AgCharts.create(options);
