import {
    AgCartesianChartOptions,
    AgCategoryAxisOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Quarterly Revenue',
    },
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'software',
            yName: 'Software',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'hardware',
            yName: 'Hardware',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'services',
            yName: 'Services',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'investments',
            yName: 'Investments',
        },
    ],
    axes: {
        x: {
            type: 'category',
            skipNullBars: true,
        },
        y: {
            type: 'number',
            label: {
                formatter: ({ value }) => `$${(value / 1000).toFixed(1)}B`,
            },
        },
    },
};

const chart = AgCharts.create(options);

function skipNullBars() {
    (options.axes!.x as AgCategoryAxisOptions).skipNullBars = true;
    chart.update(options);
}

function showNullBars() {
    (options.axes!.x as AgCategoryAxisOptions).skipNullBars = false;
    chart.update(options);
}
