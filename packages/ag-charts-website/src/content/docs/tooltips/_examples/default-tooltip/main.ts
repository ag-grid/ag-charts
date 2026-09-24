import { AgBarSeriesOptions, AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        { type: 'bar', xKey: 'month', stacked: true, yKey: 'value1', yName: 'Sweaters Made' },
        { type: 'bar', xKey: 'month', stacked: true, yKey: 'hats_made', yName: 'Hats Made' },
    ],
};

const chart = AgCharts.create(options);

function yNamesChange(event: Event) {
    const yNames = ['Sweaters Made', 'Hats Made', 'Gloves Made', 'Socks Made', 'Sunglasses Made'];
    const add = (event.target as HTMLInputElement).value === 'add';
    options.series?.forEach((series, index) => {
        (series as AgBarSeriesOptions).yName = add ? yNames[index] : undefined;
    });
    chart.update(options);
}

function showNumSeries(event: Event) {
    const num = Number((event.target as HTMLInputElement).value);
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
