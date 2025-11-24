import { AgChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import {
    BarSeriesModule,
    CategoryAxisModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);
const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Average low/high temperatures in London',
    },
    subtitle: {
        text: '(click a data point for details)',
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'high',
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'low',
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
    legend: {
        enabled: false,
    },
    listeners: {
        seriesNodeClick: ({ datum, yKey, seriesId }) => {
            console.log(`[click]\nTemperature in ${datum.month}: ${String(datum[yKey!])}°C\nSeries: ${seriesId}`);
        },
        seriesNodeDoubleClick: ({ datum, yKey, seriesId }) => {
            const celsius = Number(datum[yKey!]);
            const fahrenheit = (celsius * 9) / 5 + 32;
            console.log(
                `[double click]\nTemperature in ${datum.month}: ${fahrenheit.toFixed(2)}°F\nSeries: ${seriesId}`
            );
        },
    },
};

AgCharts.create(options);
