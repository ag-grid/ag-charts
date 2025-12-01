import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NavigatorModule,
    NumberAxisModule,
    UnitTimeAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { data } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    NavigatorModule,
    NumberAxisModule,
    UnitTimeAxisModule,
    ZoomModule,
    ContextMenuModule,
]);
const dateFormatter = new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
});

const numberFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Market Data',
    },
    subtitle: {
        text: 'Last 5 years',
    },
    data: data,
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'AAPL',
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'MSFT',
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'AMZN',
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
            interval: {
                maxSpacing: 200,
            },
            crosshair: {
                label: {
                    renderer: ({ value }) => {
                        return { text: dateFormatter.format(value) };
                    },
                },
            },
        },
        y: {
            type: 'number',
            position: 'left',
            label: {
                formatter: (params) => numberFormatter.format(+params.value),
            },
        },
    },
    legend: {
        enabled: true,
    },
    navigator: {
        enabled: true,
        miniChart: {
            enabled: true,
        },
    },
    zoom: {
        enabled: true,
    },
    initialState: {
        zoom: {
            ratioX: { start: 0.9, end: 1 },
        },
    },
};

AgCharts.create(options);
