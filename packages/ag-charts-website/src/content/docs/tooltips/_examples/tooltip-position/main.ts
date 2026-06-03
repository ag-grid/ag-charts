import { AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { CategoryAxisModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';
import { AgTooltipAnchorTo, AgTooltipPlacement } from 'ag-charts-types';

import { getData } from './data';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'line',
            xKey: 'month',
            yKey: 'sweaters',
            yName: 'Sweaters Made',
        },
    ],
    tooltip: {
        position: {
            placement: 'top',
            offset: 12,
        },
    },
};

const chart = AgCharts.create(options);

function setAnchorTo(anchorTo: AgTooltipAnchorTo) {
    options.tooltip!.position!.anchorTo = anchorTo;
    chart.update(options);
}

function setPlacement(placement: string) {
    options.tooltip!.position!.placement = placement.split(/,\s+/g) as AgTooltipPlacement[];
    chart.update(options);
}

function setOffset(event: Event) {
    const value = Number((event.target as HTMLInputElement).value);
    document.getElementById('offsetValue')!.textContent = String(value);
    options.tooltip!.position!.offset = value;
    chart.update(options);
}
