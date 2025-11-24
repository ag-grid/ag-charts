import { AgChartOptions, AgCharts } from 'ag-charts-community';
import {
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { DataType } from './data';
import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);
const customItems = ['Jun', 'Jul', 'Aug', 'Sep'];

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'temp',
            yName: 'Temperature',
            marker: {
                shape: 'diamond',
                size: 12,
                fill: 'green',
                itemStyler: ({ datum, fill, highlightState }) => {
                    return {
                        fill: customItems.includes(datum.month)
                            ? highlightState === 'highlighted-item'
                                ? 'yellow'
                                : 'red'
                            : fill,
                    };
                },
            },
        },
    ],
    legend: {
        enabled: true,
        position: 'top',
        toggleSeries: false,
    },
    axes: {
        x: {
            position: 'bottom',
            type: 'category',
            title: {
                text: 'Month',
            },
            crossLines: [
                {
                    type: 'range',
                    range: ['Jun', 'Sep'],
                },
            ],
        },
        y: {
            position: 'left',
            type: 'number',
            title: {
                text: 'Temperature (°C)',
            },
            crossLines: [
                {
                    type: 'line',
                    value: 11,
                },
            ],
        },
    },
};

const chart = AgCharts.create(options);
