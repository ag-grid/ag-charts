import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import {
    BarSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';
import { ContextMenuModule } from 'ag-charts-enterprise';

import { DataType, getData } from './data';


ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, ContextMenuModule, NumberAxisModule]);
const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Sweaters made',
    },
    contextMenu: {
        items: [
            'defaults',
            'separator',
            {
                showOn: 'always',
                label: 'Say hello',
                action: () => {
                    console.log('Hello world!');
                },
            },
            'separator',
            {
                showOn: 'series-area',
                label: 'Say hello in the series area',
                action: () => {
                    console.log('Hello in the series area!');
                },
            },
            'separator',
            {
                showOn: 'series-node',
                label: 'Say hello to a node',
                action: ({ datum, yKey }) => {
                    console.log(`Hello ${yKey} in ${datum.month}!`);
                },
            },
            'separator',
            {
                showOn: 'legend-item',
                label: 'Say hello to a legend item',
                action: ({ itemId }) => {
                    console.log(`Hello ${itemId}!`);
                },
            },
        ],
    },
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'sweaters',
            yName: 'Sweaters Made',
        },
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'hats',
            yName: 'Hats Made',
        },
    ],
};

AgCharts.create(options);
