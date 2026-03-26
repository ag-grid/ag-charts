import { AgBarSeriesTooltipRendererParams, AgChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { DataType, getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);
function renderer(params: AgBarSeriesTooltipRendererParams<DataType>) {
    const { datum, fill, yKey } = params;
    return (
        '<div class="my-tooltip" style="--color:' +
        fill +
        '">' +
        datum.month +
        '&nbsp;&#10172;&nbsp;' +
        Number(datum[yKey]).toFixed(0) +
        '</div>'
    );
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
