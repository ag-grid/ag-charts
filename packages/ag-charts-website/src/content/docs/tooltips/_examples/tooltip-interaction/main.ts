import { AgBarSeriesTooltipRendererParams, AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);
const options: AgCartesianChartOptions<DataType> = {
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

function renderer(params: AgBarSeriesTooltipRendererParams<DataType>) {
    return `<div class="tooltip">
        <div class="tooltip-title">
            ${params.datum[params.xKey]}: ${params.datum[params.yKey]}
        </div>
        <div class="tooltip-body">
            <a tabindex="0" href="#" onclick="console.log('Clicked within a tooltip')">Click here</a>
        </div>
    </div>`;
}
