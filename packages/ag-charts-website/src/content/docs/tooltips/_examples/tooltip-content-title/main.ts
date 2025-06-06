import { AgCartesianSeriesTooltipRendererParams, AgChartOptions, AgCharts } from 'ag-charts-community';

import { DataType, getData } from './data';

function renderer({ datum, yKey, yName }: AgCartesianSeriesTooltipRendererParams<DataType>) {
    const { month } = datum;
    const value = Number(datum[yKey]).toFixed(1);
    return {
        heading: 'Clothing Production',
        title: yName?.toUpperCase(),
        data: [
            {
                label: month,
                value,
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
