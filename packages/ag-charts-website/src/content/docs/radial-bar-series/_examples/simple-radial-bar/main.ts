import { ModuleRegistry } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { AngleNumberAxisModule, RadialBarSeriesModule, RadiusCategoryAxisModule } from 'ag-charts-enterprise';

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
