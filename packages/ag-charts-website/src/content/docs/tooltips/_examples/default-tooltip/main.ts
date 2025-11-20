import { AgBarSeriesOptions, AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import {
    BarSeriesModule,
    CategoryAxisModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';

import { getData } from './data';


ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        { type: 'bar', xKey: 'month', stacked: true, yKey: 'value1', yName: 'Sweaters Made' },
        { type: 'bar', xKey: 'month', stacked: true, yKey: 'hats_made', yName: 'Hats Made' },
    ],
};

const chart = AgCharts.create(options);

function removeYNames() {
    for (const series of options.series ?? []) {
        (series as AgBarSeriesOptions).yName = undefined;
    }
    chart.update(options);
}

function addYNames() {
    (options.series![0] as AgBarSeriesOptions).yName = 'Sweaters Made';
    if (options.series![1]) (options.series![1] as AgBarSeriesOptions).yName = 'Hats Made';
    if (options.series![2]) (options.series![2] as AgBarSeriesOptions).yName = 'Gloves Made';
    if (options.series![3]) (options.series![3] as AgBarSeriesOptions).yName = 'Socks Made';
    if (options.series![4]) (options.series![4] as AgBarSeriesOptions).yName = 'Sunglasses Made';
    chart.update(options);
}

function showNumSeries(num: number) {
    const hasYNames = (options.series![0] as AgBarSeriesOptions).yName != null;
    if (num === 1) {
        options.series = [{ type: 'bar', xKey: 'month', stacked: true, yKey: 'value1', yName: 'Sweaters Made' }];
    } else if (num === 2) {
        options.series = [
            { type: 'bar', xKey: 'month', stacked: true, yKey: 'value1', yName: 'Sweaters Made' },
            { type: 'bar', xKey: 'month', stacked: true, yKey: 'hats_made', yName: 'Hats Made' },
        ];
    } else {
        options.series = [
            { type: 'bar', xKey: 'month', stacked: true, yKey: 'value1', yName: 'Sweaters Made' },
            { type: 'bar', xKey: 'month', stacked: true, yKey: 'hats_made', yName: 'Hats Made' },
            { type: 'bar', xKey: 'month', stacked: true, yKey: 'gloves_made', yName: 'Gloves Made' },
            { type: 'bar', xKey: 'month', stacked: true, yKey: 'socks_made', yName: 'Socks Made' },
            { type: 'bar', xKey: 'month', stacked: true, yKey: 'sunglasses_made', yName: 'Sunglasses Made' },
        ];
    }
    if (!hasYNames) {
        for (const series of options.series ?? []) {
            (series as AgBarSeriesOptions).yName = undefined;
        }
    }
    chart.update(options);
}
