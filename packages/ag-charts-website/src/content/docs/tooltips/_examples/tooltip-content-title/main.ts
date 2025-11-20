import { AgCartesianSeriesTooltipRendererParams, AgChartOptions, AgCharts } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);
function renderer({ datum, yKey, yName }: AgCartesianSeriesTooltipRendererParams<DataType>) {
    return {
        heading: 'Clothing Production',
        title: yName?.toUpperCase(),
        data: [
            {
                label: datum.month,
                value: Number(datum[yKey]).toFixed(1),
            },
        ],
    };
}

const options: AgChartOptions<DataType> = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'month',
            tooltip: { renderer },
            yKey: 'sweaters',
            yName: 'Sweaters made',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'month',
            tooltip: { renderer },
            yKey: 'hats',
            yName: 'Hats made',
            stacked: true,
        },
    ],
};

const chart = AgCharts.create(options);
