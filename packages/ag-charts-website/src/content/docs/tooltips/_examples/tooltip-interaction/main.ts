import { AgBarSeriesTooltipRendererParams, AgCartesianChartOptions, AgCharts } from 'ag-charts-community';

import { getData } from './data';

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'sweaters',
            yName: 'Sweaters Made',
            tooltip: {
                renderer,
                interaction: {
                    enabled: true,
                },
            },
        },
    ],
};

const chart = AgCharts.create(options);

function renderer(params: AgBarSeriesTooltipRendererParams) {
    return `<div class="ag-chart-tooltip-title" style="background-color: ${params.fill}">
      ${params.datum[params.xKey]}
    </div>
    <div class="ag-chart-tooltip-content">
      <a href="#" onclick="window.alert('Clicked within a tooltip')">Click here</a> | ${params.datum[params.yKey]}
    </div>`;
}
