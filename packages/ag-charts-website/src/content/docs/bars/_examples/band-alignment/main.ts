import {
    AgBandAlignment,
    AgCartesianChartOptions,
    AgCategoryAxisOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);

const options: AgCartesianChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'Total Visitors to Museums and Galleries',
    },
    footnote: {
        text: 'Source: Department for Digital, Culture, Media & Sport',
    },
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'museums',
            yName: 'Museums',
            width: 10,
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'galleries',
            yName: 'Galleries',
            width: 10,
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'heritage',
            yName: 'Heritage Sites',
            width: 10,
        },
    ],
    axes: {
        x: {
            type: 'category',
            bandAlignment: 'start',
        },
        y: {
            type: 'number',
            title: {
                text: 'Total Visitors (Millions)',
            },
        },
    },
    formatter: {
        y(params) {
            const value = params.value as number;
            const millions = value / 1_000_000;
            const accuracy = ['series-label', 'axis-label'].includes(params.source) ? 0 : 1;
            return `${millions.toFixed(accuracy)}M`;
        },
    },
};

const chart = AgCharts.create(options);

function changeBandAlignment(alignment: AgBandAlignment) {
    (options.axes!.x! as AgCategoryAxisOptions).bandAlignment = alignment;
    chart.update(options);
}
