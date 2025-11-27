import { AgChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import { LineSeriesModule, ModuleRegistry, NumberAxisModule, UnitTimeAxisModule } from 'ag-charts-community';

import { getLoungeData, getOfficeData } from './data';

ModuleRegistry.registerModules([LegendModule, LineSeriesModule, NumberAxisModule, UnitTimeAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Temperature Readings',
    },
    series: [
        {
            type: 'line',
            data: getLoungeData(),
            xKey: 'time',
            yKey: 'sensor',
            yName: 'Lounge',
        },
        {
            type: 'line',
            data: getOfficeData(),
            xKey: 'time',
            yKey: 'sensor',
            yName: 'Office',
        },
    ],
    axes: {
        x: {
            type: 'unit-time',
        },
        y: {
            type: 'number',
            label: {
                format: '#{.1f} °C',
            },
        },
    },
};

AgCharts.create(options);
