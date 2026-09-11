import { AgCartesianChartOptions, AgChartLegendClickEvent, AgCharts } from 'ag-charts-community';
import {
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);
let counter = 1;

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
                counter = (counter + 1) % 2;
                document.getElementById('myCounter')!.textContent = `${counter}`;
                if (counter !== 1) {
                    event.preventDefault();
                }
            },
        },
    },
    listeners: {
        seriesVisibilityChange: (event) => {
            console.log('[series visibility change]', event);
        },
    },
};

AgCharts.create(options);
