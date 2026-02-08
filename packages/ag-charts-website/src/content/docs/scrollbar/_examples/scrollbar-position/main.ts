import {
    AgCartesianChartOptions,
    AgCharts,
    AreaSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    ScrollbarModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([
    AreaSeriesModule,
    NumberAxisModule,
    OrdinalTimeAxisModule,
    ScrollbarModule,
    ZoomModule,
]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Museum Visitors',
    },
    data: getData(),
    series: [
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Modern',
            yName: 'Tate Modern',
            stacked: true,
        },
        {
            type: 'area',
            xKey: 'date',
            yKey: 'Tate Britain',
            yName: 'Tate Britain',
            stacked: true,
        },
    ],
    axes: {
        x: {
            type: 'ordinal-time',
            interval: { maxSpacing: 200 },
        },
        y: {
            type: 'number',
            label: {
                formatter: (params) => `${params.value / 1000}k`,
            },
        },
    },
    scrollbar: {
        enabled: true,
        vertical: {
            position: 'right',
        },
    },
    initialState: {
        zoom: {
            ratioX: { start: 0.1, end: 0.5 },
            ratioY: { start: 0.2, end: 0.75 },
        },
    },
    legend: {
        enabled: false,
    },
};

const chart = AgCharts.create(options);

function setVerticalPosition(value: 'left' | 'right') {
    options.scrollbar = {
        ...options.scrollbar,
        vertical: {
            ...options.scrollbar!.vertical,
            position: value,
        },
    };
    chart.update(options);
}

function setHorizontalPosition(value: 'top' | 'bottom') {
    options.scrollbar = {
        ...options.scrollbar,
        horizontal: {
            ...options.scrollbar!.horizontal,
            position: value,
        },
    };
    chart.update(options);
}
