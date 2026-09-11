import {
    AgCartesianChartOptions,
    AgChartLegendClickEvent,
    AgChartLegendDoubleClickEvent,
    AgCharts,
} from 'ag-charts-community';
import {
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        {
            quarter: 'Q1',
            petrol: 200,
            diesel: 100,
        },
        {
            quarter: 'Q2',
            petrol: 300,
            diesel: 130,
        },
        {
            quarter: 'Q3',
            petrol: 350,
            diesel: 160,
        },
        {
            quarter: 'Q4',
            petrol: 400,
            diesel: 200,
        },
    ],
    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'petrol',
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'diesel',
        },
    ],

    legend: {
        listeners: {
            legendItemClick: (event: AgChartLegendClickEvent) => {
                console.log('[click]', event);
            },
            legendItemDoubleClick: (event: AgChartLegendDoubleClickEvent) => {
                console.log('[double click]', event);
            },
        },
    },
};

AgCharts.create(options);
