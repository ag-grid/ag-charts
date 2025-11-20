import { AgChartOptions, AgCharts } from 'ag-charts-community';
import { LineSeriesModule, ModuleRegistry, NumberAxisModule, UnitTimeAxisModule } from 'ag-charts-community';

ModuleRegistry.registerModules([LineSeriesModule, NumberAxisModule, UnitTimeAxisModule]);
const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'temp',
        },
    ],
    axes: {
        y: {
            type: 'number',
            position: 'left',
            label: {
                format: '$#{0>6.2f}',
            },
        },
        x: {
            type: 'unit-time',
            position: 'bottom',
            interval: { step: 'month' },
            label: {
                format: '%b %Y',
            },
        },
    },
    data: [
        { date: new Date('2019-01-01'), temp: 82.0 },
        { date: new Date('2019-02-01'), temp: 75.0 },
        { date: new Date('2019-03-01'), temp: 62.0 },
        { date: new Date('2019-04-01'), temp: 99.0 },
        { date: new Date('2019-05-01'), temp: 82.0 },
    ],
};

AgCharts.create(options);
