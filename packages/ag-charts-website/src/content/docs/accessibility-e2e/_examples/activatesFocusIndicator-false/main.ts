import {
    AgChartOptions,
    AgCharts,
    AnnotationsModule,
    BarSeriesModule,
    CategoryAxisModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AnnotationsModule,
    BarSeriesModule,
    CategoryAxisModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    ZoomModule,
]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [{ type: 'bar', xKey: 'month', yKey: 'revenue', fill: 'grey' }],
    annotations: { enabled: true },
    zoom: { enabled: true },
    initialState: {
        annotations: [
            {
                type: 'comment',
                x: { value: 'May', groupPercentage: 0 },
                y: 80,
                text: 'Test annotation.\n\nThis annotation will be deleted\nand restored with "Undo"',
                fontSize: 12,
            },
        ],
    },
};

AgCharts.create(options);
