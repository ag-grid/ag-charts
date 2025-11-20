import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import {
    CategoryAxisModule,
    LineSeriesModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';
import { AgTooltipAnchorTo, AgTooltipPlacement } from 'ag-charts-types';

import { getData } from './data';


ModuleRegistry.registerModules([CategoryAxisModule, LineSeriesModule, NumberAxisModule]);
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
        position: {},
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
