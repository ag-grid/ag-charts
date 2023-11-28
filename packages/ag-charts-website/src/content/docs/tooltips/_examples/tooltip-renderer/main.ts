import { AgCartesianSeriesTooltipRendererParams, AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

function renderer(params: AgCartesianSeriesTooltipRendererParams) {
    return (
        '<div class="ag-chart-tooltip-title" style="background-color:' +
        params.color +
        '">' +
        params.datum[params.xKey] +
        '</div>' +
        '<div class="ag-chart-tooltip-content">' +
        params.datum[params.yKey].toFixed(0) +
        '</div>'
    );
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
