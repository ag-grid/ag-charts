import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { ModuleRegistry } from 'ag-charts-community';
import { AngleCategoryAxisModule, RadialColumnSeriesModule, RadiusNumberAxisModule } from 'ag-charts-enterprise';

import { getData } from './data';


ModuleRegistry.registerModules([AngleCategoryAxisModule, RadialColumnSeriesModule, RadiusNumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Revenue by Product Category',
    },
    subtitle: {
        text: 'Millions USD',
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
