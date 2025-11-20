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
            labelKey: 'name',
        },
    ],
    title: {
        text: 'Organisational Chart',
    },
};

AgCharts.create(options);
