import { AgBarSeriesTooltipRendererParams, AgChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

function renderer(params: AgBarSeriesTooltipRendererParams) {
    return (
        '<div class="my-tooltip" style="--color:' +
        params.fill +
        '">' +
        params.datum[params.xKey] +
        '&nbsp;&#10172;&nbsp;' +
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
