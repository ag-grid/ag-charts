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
        text: 'Scroll over the series area or axis to pan the chart',
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
        enableSeriesAreaScrolling: true,
        enableAxisScrolling: true,
        vertical: {
            position: 'left',
        },
    },
};

const chart = AgCharts.create(options);

function setSeriesAreaScrolling(enabled: boolean) {
    options.scrollbar!.enableSeriesAreaScrolling = enabled;
    chart.update(options);
}

function setAxisScrolling(enabled: boolean) {
    options.scrollbar!.enableAxisScrolling = enabled;
    chart.update(options);
}
