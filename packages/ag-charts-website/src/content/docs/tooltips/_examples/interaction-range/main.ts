import { AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { CategoryAxisModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    tooltip: {
        range: 'nearest',
    },
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'value1',
            yName: 'Sweaters Made',
        },
        {
            type: 'line',
            xKey: 'month',
            yKey: 'hats_made',
            yName: 'Hats Made',
        },
    ],
};

const chart = AgCharts.create(options);

function setInteractionRange(event: Event) {
    switch ((event.target as HTMLInputElement).value) {
        case 'nearest':
            options.tooltip = { range: 'nearest' };
            break;
        case 'exact':
            options.tooltip = { range: 'exact' };
            break;
        case 'distance':
            options.tooltip = { range: 10 };
            break;
    }
    chart.update(options);
}
