import {
    BarSeriesModule,
    CategoryAxisModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';
import { SyncModule } from 'ag-charts-enterprise';

import { currentData, historicalData } from './data';

ModuleRegistry.registerModules([
    AnimationModule,
    BarSeriesModule,
    CategoryAxisModule,
    CrosshairModule,
    LegendModule,
    NumberAxisModule,
    SyncModule,
    ZoomModule,
]);
const commonOptions: AgCartesianChartOptions = {
    sync: {
        axes: 'y',
        nodeInteraction: false,
    },
    title: {
        text: 'Renewable Fuel Sources',
    },
    axes: {
        y: {
            type: 'number',
            position: 'left',
            crosshair: { enabled: false },
        },
        x: {
            position: 'bottom',
            type: 'category',
            crosshair: { enabled: false },
            label: {
                autoRotate: false,
            },
        },
    },
    series: [
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Offshore wind',
            yName: 'Offshore Wind',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Landfill gas',
            yName: 'Landfill Gas',
        },
        {
            type: 'bar',
            xKey: 'year',
            yKey: 'Plant biomass',
            yName: 'Plant Biomass',
        },
    ],
};

const chartOptions1 = {
    ...commonOptions,
    container: document.getElementById('myChart1'),
    subtitle: {
        text: 'Historical Data',
    },
    data: historicalData,
};

AgCharts.create(chartOptions1);

const chartOptions2 = {
    ...commonOptions,
    container: document.getElementById('myChart2'),
    subtitle: {
        text: 'Current Data',
    },
    data: currentData,
};

AgCharts.create(chartOptions2);
