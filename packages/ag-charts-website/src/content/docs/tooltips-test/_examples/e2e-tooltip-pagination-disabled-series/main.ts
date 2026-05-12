import type { AgCartesianChartOptions } from 'ag-charts-community';
import {
    AgCharts,
    BubbleSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

ModuleRegistry.registerModules([BubbleSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    tooltip: { pagination: true },
    data: [{ x: 1, y: 1, z1: 3, z2: 2, z3: 1 }],
    series: [
        {
            type: 'bubble',
            xKey: 'x',
            yKey: 'y',
            legendItemName: 'y1',
            sizeKey: 'z1',
            domain: [1, 3],
            size: 30,
            maxSize: 130,
            highlight: { enabled: false },
        },
        {
            type: 'bubble',
            xKey: 'x',
            yKey: 'y',
            legendItemName: 'y2',
            sizeKey: 'z2',
            domain: [1, 3],
            size: 30,
            maxSize: 130,
            highlight: { enabled: false },
            tooltip: { enabled: false },
        },
        {
            type: 'bubble',
            xKey: 'x',
            yKey: 'y',
            legendItemName: 'y3',
            sizeKey: 'z3',
            domain: [1, 3],
            size: 30,
            maxSize: 130,
            highlight: { enabled: false },
        },
    ],
};
AgCharts.create(options);
