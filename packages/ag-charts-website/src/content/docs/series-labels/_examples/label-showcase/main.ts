import { AgBarSeriesOptions, AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { DataType, data } from './data';

ModuleRegistry.registerModules([BarSeriesModule, LegendModule, CategoryAxisModule, NumberAxisModule]);

function seriesLabel(): AgBarSeriesOptions<DataType>['label'] {
    return {
        enabled: true,
        fontWeight: 'bold',
        placement: ['inside-center', 'beside-after-center', 'beside-before-center'],
        orientation: 'horizontal',
        border: { enabled: true, strokeWidth: 1 },
        insideStyle: {
            color: 'white',
            fill: 'black',
            fillOpacity: 0.6,
            border: { stroke: 'white' },
        },
        outsideStyle: {
            color: 'black',
            fill: 'white',
            fillOpacity: 0.8,
            border: { stroke: 'black' },
        },
    };
}

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    title: { text: 'Quarterly Revenue by Product Line ($m)' },
    data,
    series: [
        { type: 'bar', xKey: 'quarter', yKey: 'hardware', yName: 'Hardware', stacked: true, label: seriesLabel() },
        { type: 'bar', xKey: 'quarter', yKey: 'services', yName: 'Services', stacked: true, label: seriesLabel() },
        { type: 'bar', xKey: 'quarter', yKey: 'software', yName: 'Software', stacked: true, label: seriesLabel() },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number', title: { text: 'Revenue ($m)' } },
    },
};

AgCharts.create(options);
