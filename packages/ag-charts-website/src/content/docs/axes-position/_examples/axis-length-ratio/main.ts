import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    TimeAxisModule,
} from 'ag-charts-community';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, LegendModule, LineSeriesModule, NumberAxisModule, TimeAxisModule]);

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Share Price and Trading Volume',
    },
    data: getData(),
    axes: {
        x: {
            type: 'time',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'right',
            title: { text: 'Price ($)' },
        },
        yVolume: {
            type: 'number',
            position: 'left',
            lengthRatio: 0.2,
            title: { text: 'Volume (M)' },
            gridLine: { enabled: false },
        },
    },
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'price',
            yName: 'Price',
        },
        {
            type: 'bar',
            xKey: 'date',
            yKey: 'volume',
            yName: 'Volume',
            yKeyAxis: 'yVolume',
            fillOpacity: 0.6,
        },
    ],
};

AgCharts.create(options);
