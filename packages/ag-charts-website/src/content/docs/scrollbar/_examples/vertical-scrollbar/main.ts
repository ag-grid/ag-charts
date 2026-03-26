import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    ScrollbarModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, NumberAxisModule, OrdinalTimeAxisModule, ScrollbarModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Museum Visitors',
    },
    subtitle: {
        text: 'Vertical Scrollbar is used when panning vertically is required',
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'date',
            yKey: 'Tate Modern',
            yName: 'Tate Modern',
            width: 12,
        },
        {
            type: 'bar',
            direction: 'horizontal',
            xKey: 'date',
            yKey: 'Tate Britain',
            yName: 'Tate Britain',
            width: 12,
        },
    ],
    axes: {
        y: {
            type: 'ordinal-time',
            interval: { maxSpacing: 200 },
        },
        x: {
            type: 'number',
            label: {
                formatter: (params) => `${params.value / 1000}k`,
            },
        },
    },
    scrollbar: {
        enabled: true,
        vertical: {
            position: 'left',
        },
    },
};

const chart = AgCharts.create(options);
