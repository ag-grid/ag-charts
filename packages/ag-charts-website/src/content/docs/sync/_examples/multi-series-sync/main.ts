import {
    BarSeriesModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    UnitTimeAxisModule,
} from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { SyncModule } from 'ag-charts-enterprise';

import { regionAdata, regionBdata } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    BarSeriesModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    SyncModule,
    UnitTimeAxisModule,
    ZoomModule,
]);
const commonOptions: AgCartesianChartOptions = {
    sync: { axes: 'xy' },
    series: [
        {
            type: 'bar',
            xKey: 'date',
            yKey: 'domestic',
            yName: 'Domestic',
        },
        {
            type: 'bar',
            xKey: 'date',
            yKey: 'international',
            yName: 'International',
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'product',
            yName: 'Product',
            yKeyAxis: 'ySecondary',
        },
        {
            type: 'line',
            xKey: 'date',
            yKey: 'services',
            yName: 'Services',
            yKeyAxis: 'ySecondary',
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
            max: 100,
        },
        ySecondary: {
            type: 'number',
            position: 'right',
        },
    },
    tooltip: { mode: 'single' },
};

const chartOptions1 = {
    ...commonOptions,
    container: document.getElementById('myChart1'),
    title: {
        text: 'Region A',
    },
    data: regionAdata,
};

AgCharts.create(chartOptions1);

const chartOptions2 = {
    ...commonOptions,
    container: document.getElementById('myChart2'),
    title: {
        text: 'Region B',
    },
    data: regionBdata,
};

AgCharts.create(chartOptions2);
