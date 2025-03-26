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
    return `<div class="tooltip">
        <div class="tooltip-title">
            ${params.datum[params.xKey]}: ${params.datum[params.yKey]}
        </div>
        <div class="tooltip-body">
            <a tabindex="0" href="#" onclick="console.log('Clicked within a tooltip')">Click here</a>
        </div>
    </div>`;
}
