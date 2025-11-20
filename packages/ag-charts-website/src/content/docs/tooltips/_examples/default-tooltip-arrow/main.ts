import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'month',
            stacked: true,
            yKey: 'value1',
            yName: 'Sweaters Made',
        },
        {
            type: 'bar',
            xKey: 'month',
            stacked: true,
            yKey: 'hats_made',
            yName: 'Hats Made',
        },
    ],
    tooltip: {
        showArrow: true,
    },
};

const chart = AgCharts.create(options);

function toggleTooltipArrow() {
    options.tooltip!.showArrow = !options.tooltip!.showArrow;
    chart.update(options);
}
