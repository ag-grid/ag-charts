import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { ModuleRegistry } from 'ag-charts-community';
import { AngleCategoryAxisModule, RadialBarSeriesModule, RadiusNumberAxisModule } from 'ag-charts-enterprise';

import { getData } from './data';


ModuleRegistry.registerModules([RadialBarSeriesModule, AngleCategoryAxisModule, RadiusNumberAxisModule]);
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
};

AgCharts.create(options);
