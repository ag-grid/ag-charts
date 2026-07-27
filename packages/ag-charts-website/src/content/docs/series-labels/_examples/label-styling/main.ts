import { AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { DataType, data } from './data';

ModuleRegistry.registerModules([BarSeriesModule, LegendModule, CategoryAxisModule, NumberAxisModule]);

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: { text: 'Quarterly Profit Change ($m)' },
    data,
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'profitChange',
            label: {
                enabled: true,
                fontWeight: 'bold',
                placement: ['inside-end', 'outside-end'],
                cornerRadius: 4,
                padding: { top: 2, bottom: 2, left: 6, right: 6 },
                border: { enabled: true, strokeWidth: 1 },
                insideStyle: {
                    color: 'white',
                    fill: 'rgba(0, 0, 0, 0.6)',
                    border: { stroke: 'white' },
                },
                outsideStyle: {
                    color: 'black',
                    fill: 'rgba(255, 255, 255, 0.8)',
                    border: { stroke: 'black' },
                },
            },
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number', title: { text: 'Profit Change ($m)' } },
    },
};

const chart = AgCharts.create(options);
