import { AgCartesianSeriesTooltipRendererParams, AgChartOptions, AgCharts } from 'ag-charts-community';

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
    data: [
        {
            month: 'Dec',
            sweaters: 50,
            hats: 40,
        },
        {
            month: 'Jan',
            sweaters: 70,
            hats: 50,
        },
        {
            month: 'Feb',
            sweaters: 60,
            hats: 30,
        },
    ],
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

var chart = AgCharts.create(options);
