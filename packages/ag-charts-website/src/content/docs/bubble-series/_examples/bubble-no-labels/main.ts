import { AgChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { BubbleSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

import { femaleData, maleData } from './data';

ModuleRegistry.registerModules([BubbleSeriesModule, LegendModule, NumberAxisModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    series: [
        {
            type: 'bubble',
            title: 'Male',
            data: maleData,
            xKey: 'height',
            yKey: 'weight',
            sizeKey: 'age',
        },
        {
            type: 'bubble',
            title: 'Female',
            data: femaleData,
            xKey: 'height',
            yKey: 'weight',
            sizeKey: 'age',
        },
    ],
    axes: {
        x: {
            type: 'number',
            label: {
                enabled: false,
            },
            gridLine: {
                enabled: false,
            },
            line: {
                enabled: false,
            },
        },
        y: {
            type: 'number',
            label: {
                enabled: false,
            },
            gridLine: {
                enabled: false,
            },
            line: {
                enabled: false,
            },
        },
    },
    legend: {
        enabled: false,
    },
};

AgCharts.create(options);
