import {
    AgCartesianChartOptions,
    AgCartesianSeriesTooltipRendererParams,
    AgCharts,
    AgSeriesTooltip,
} from 'ag-charts-enterprise';
import {
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    UnitTimeAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';
import { NavigatorModule, ZoomModule } from 'ag-charts-enterprise';

import { data } from './data';


ModuleRegistry.registerModules([LegendModule, LineSeriesModule, NavigatorModule, NumberAxisModule, UnitTimeAxisModule, ZoomModule]);
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
            marker: {
                enabled: false,
            },
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'MSFT',
            marker: {
                enabled: false,
            },
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'AMZN',
            marker: {
                enabled: false,
            },
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
            label: {
                fontSize: 20,
                fontWeight: 'bold',
            },
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

const chart = AgCharts.create(options);
