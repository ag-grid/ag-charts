import { AgChartOptions, AgCharts } from 'ag-charts-community';
import { CategoryAxisModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LineSeriesModule, NumberAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Annual Fuel Expenditure',
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'petrol',
            yName: 'Petrol',
            strokeWidth: 4,
            marker: {
                enabled: false,
            },
        },
        {
            type: 'line',
            xKey: 'quarter',
            yKey: 'diesel',
            yName: 'Diesel',
            stroke: 'black',
            label: {
                fontWeight: 'bold',
                formatter: ({ value }) => value.toFixed(0),
            },
            marker: {
                fill: 'orange',
                size: 10,
                stroke: 'black',
                strokeWidth: 3,
                shape: 'diamond',
            },
        },
    ],
};

AgCharts.create(options);
