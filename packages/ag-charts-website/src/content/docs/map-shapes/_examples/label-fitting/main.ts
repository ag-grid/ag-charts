import { AgChartOptions, AgCharts, MapShapeSeriesModule, ModuleRegistry } from 'ag-charts-enterprise';

import { DataType, data } from './data';
import { topology } from './topology';

ModuleRegistry.registerModules([MapShapeSeriesModule]);

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'US States',
    },
    data,
    topology,
    series: [
        {
            type: 'map-shape',
            idKey: 'name',
            labelKey: 'name',
            label: {
                wrapping: 'on-space',
                truncate: true,
                minimumFontSize: 8,
            },
        },
    ],
};

AgCharts.create(options);
