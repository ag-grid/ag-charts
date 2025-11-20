import { CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { TreemapSeriesModule } from 'ag-charts-enterprise';

import { data } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, NumberAxisModule, TreemapSeriesModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'treemap',
            labelKey: 'title',
        },
    ],
    title: {
        text: 'UK Government Budget',
    },
    subtitle: {
        text: '2024',
    },
};

AgCharts.create(options);
