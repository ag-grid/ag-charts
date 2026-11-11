import {
    AgCartesianChartOptions,
    AgCharts,
    HistogramSeriesModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    ScatterSeriesModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([HistogramSeriesModule, LegendModule, NumberAxisModule, ScatterSeriesModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    theme: 'ag-accessible',
    title: {
        text: 'Vehicle Fuel Efficiency',
    },
    subtitle: {
        text: 'USA 1987',
    },
    data: getData(),
    series: [
        {
            type: 'histogram',
            xKey: 'engine-size',
            xName: 'Engine Size',
            yKey: 'highway-mpg',
            yName: 'Mean Highway MPG',
            aggregation: 'mean',
        },
        {
            type: 'scatter',
            xKey: 'engine-size',
            xName: 'Engine Size',
            yKey: 'highway-mpg',
            yName: 'Highway MPG',
        },
    ],
    axes: {
        x: {
            type: 'number',
            title: { text: 'Engine Size (cc)' },
        },
        y: {
            type: 'number',
            title: { text: 'Highway MPG' },
        },
    },
};

AgCharts.create(options);
