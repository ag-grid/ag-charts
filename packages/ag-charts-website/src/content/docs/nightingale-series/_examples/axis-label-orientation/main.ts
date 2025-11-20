import { ModuleRegistry } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { AngleCategoryAxisModule, NightingaleSeriesModule, RadiusNumberAxisModule } from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([AngleCategoryAxisModule, NightingaleSeriesModule, RadiusNumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: `Revenue by product category`,
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
        angle: {
            type: 'angle-category',
            label: {
                orientation: 'parallel',
            },
        },
        radius: {
            type: 'radius-number',
        },
    },
};

AgCharts.create(options);
