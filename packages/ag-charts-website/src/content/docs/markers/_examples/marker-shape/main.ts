import { AgChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { CategoryAxisModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Fuel Spending (2019)',
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'petrol',
            title: 'Petrol',
            marker: {
                shape: 'square',
                size: 10,
            },
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'diesel',
            title: 'Diesel',
            stroke: 'black',
            marker: {
                size: 15,
                fill: 'gray',
                stroke: 'black',
            },
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'electric',
            title: 'Electric',
            stroke: '#8bc24a',
            marker: {
                shape: 'cross',
                size: 20,
                fill: '#8bc24a',
                stroke: '#658d36',
            },
        },
    ],
};

AgCharts.create(options);
