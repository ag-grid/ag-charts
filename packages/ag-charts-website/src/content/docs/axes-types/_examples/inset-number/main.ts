import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    InsetNumberAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    TimeAxisModule,
} from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([
    BarSeriesModule,
    InsetNumberAxisModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    TimeAxisModule,
]);

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
            type: 'inset-number',
            position: 'left',
            lengthRatio: 0.2,
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
