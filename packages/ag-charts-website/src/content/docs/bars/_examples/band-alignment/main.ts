import {
    AgBandAlignment,
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
        text: "Apple's Revenue by Product Category",
    },
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'iphone',
            yName: 'iPhone',
            stacked: true,
            width: 50,
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'mac',
            yName: 'Mac',
            stacked: true,
            width: 50,
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'ipad',
            yName: 'iPad',
            stacked: true,
            width: 50,
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'wearables',
            yName: 'Wearables',
            stacked: true,
            width: 50,
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'services',
            yName: 'Services',
            stacked: true,
            width: 50,
        },
    ],
    axes: {
        x: {
            type: 'category',
            bandAlignment: 'start',
        },
    },
};

const chart = AgCharts.create(options);

function changeBandAlignment(alignment: AgBandAlignment) {
    (options.axes!.x! as AgCategoryAxisOptions).bandAlignment = alignment;
    chart.update(options);
}
