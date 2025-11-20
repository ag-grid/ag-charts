import { AgChartOptions, AgCharts } from 'ag-charts-enterprise';
import { CategoryAxisModule, NumberAxisModule, ModuleRegistry } from 'ag-charts-community';
import { TreemapSeriesModule } from 'ag-charts-enterprise';

import { DataType, data } from './data';


ModuleRegistry.registerModules([CategoryAxisModule, NumberAxisModule, TreemapSeriesModule]);
const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data,
    series: [
        {
            type: 'treemap',
            labelKey: 'name',
            group: {
                strokeWidth: 0,
                fillOpacity: 0.5,
            },
        },
    ],
    title: {
        text: 'Organisation Chart',
    },
};

AgCharts.create(options);
