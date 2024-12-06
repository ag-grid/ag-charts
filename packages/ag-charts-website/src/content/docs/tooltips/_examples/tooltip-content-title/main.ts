import { AgCartesianSeriesTooltipRendererParams, AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

function renderer({ datum, xKey, yKey, yName }: AgCartesianSeriesTooltipRendererParams) {
    return {
        heading: 'Clothing Production',
        title: yName?.toUpperCase(),
        data: [
            {
                label: datum[xKey],
                value: datum[yKey].toFixed(1),
            },
        ],
    };
}

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'month',
            tooltip: { renderer: renderer },
            yKey: 'sweaters',
            yName: 'Sweaters made',
            stacked: true,
        },
        {
            type: 'bar',
            xKey: 'month',
            tooltip: { renderer: renderer },
            yKey: 'hats',
            yName: 'Hats made',
            stacked: true,
        },
    ],
};

const chart = AgCharts.create(options);
