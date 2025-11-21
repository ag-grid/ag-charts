// @ag-skip-fws
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import { ContextMenuModule } from 'ag-charts-enterprise';

import { DataType, data1, data2 } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, ContextMenuModule, NumberAxisModule]);

const action = () => console.log('Hello world!');
const nodeAction = (event: any) => console.log(`Hello ${event.yKey} in ${event.datum.month}!`);
const legendItemAction = (event: any) => console.log(`Hello ${event.itemId}!`);

// Chart Options
const options1: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart1'),
    title: { text: 'Chart 1' },
    legend: {},
    height: 600,
    width: 800,
    contextMenu: {
        items: [
            'defaults',
            'separator',
            { showOn: 'always', label: 'Say hello', action },
            'separator',
            { showOn: 'series-node', label: 'Say hello to a node', action: nodeAction },
            'separator',
            { showOn: 'legend-item', label: 'Say hello to a legend item', action: legendItemAction },
        ],
    },
    data: data1,
    series: [
        { type: 'bar', xKey: 'month', yKey: 'sweaters', yName: 'Sweaters Made' },
        { type: 'bar', xKey: 'month', yKey: 'hats', yName: 'Hats Made' },
    ],
};

const options2: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart2'),
    title: { text: 'Chart 2' },
    contextMenu: { enabled: true },
    height: 600,
    width: 800,
    data: data2,
    series: [{ type: 'bar', xKey: 'month', yKey: 'sweaters', yName: 'Sweaters Made' }],
};

AgCharts.create(options1);
AgCharts.create(options2);
