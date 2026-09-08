import {
    AgCartesianChartOptions,
    AgChartLegendPlacement,
    AgChartLegendPositionOptions,
    AgCharts,
} from 'ag-charts-community';
import {
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

import { getData } from './data';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, LegendModule, NumberAxisModule]);
const options: AgCartesianChartOptions & { legend: { position: AgChartLegendPositionOptions } } = {
    container: document.getElementById('myChart'),
    data: getData(),
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'naturalGas',
            yName: 'Natural gas',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'coal',
            yName: 'Coal',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'primaryOil',
            yName: 'Primary oil',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'petroleum',
            yName: 'Petroleum',
        },
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'manufacturedFuels',
            yName: 'Manufactured fuels',
        },
    ],
    legend: {
        position: {
            placement: 'right',
        },
    },
};

const chart = AgCharts.create(options);

function updateLegendPlacement(value: AgChartLegendPlacement) {
    options.legend!.position!.placement = value;
    chart.update(options);
}

function legendChange(event: Event) {
    const enabled = (event.target as HTMLInputElement).value === 'show';

    const legendPlacementGroup = document.getElementById('legendPlacementGroup') as HTMLFieldSetElement;
    legendPlacementGroup.disabled = !enabled;

    options.legend!.enabled = enabled;
    chart.update(options);
}
