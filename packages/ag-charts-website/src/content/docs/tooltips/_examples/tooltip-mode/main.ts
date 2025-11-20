import { AgCartesianChartOptions, AgCharts, AgTooltipMode } from 'ag-charts-community';
import {
    LineSeriesModule,
    NumberAxisModule,
    UnitTimeAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';

import { getData } from './data';


ModuleRegistry.registerModules([LineSeriesModule, NumberAxisModule, UnitTimeAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    tooltip: {
        mode: 'single',
    },
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Onshore wind',
            yName: 'Onshore Wind',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Offshore wind',
            yName: 'Offshore Wind',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Solar photovoltaics',
            yName: 'Solar Photovoltaics',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Plant biomass',
            yName: 'Plant Biomass',
        },
        {
            type: 'line',
            xKey: 'year',
            yKey: 'Landfill gas',
            yName: 'Landfill Gas',
        },
    ],
    axes: {
        x: {
            position: 'bottom',
            type: 'unit-time',
        },
        y: {
            position: 'right',
            type: 'number',
        },
    },
};

const chart = AgCharts.create(options);

function setTooltipMode(mode: AgTooltipMode) {
    options.tooltip!.mode = mode;
    chart.update(options);
}
