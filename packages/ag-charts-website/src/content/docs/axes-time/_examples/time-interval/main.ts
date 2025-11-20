import { AgCartesianChartOptions, AgCharts, AgUnitTimeAxisThemeOptions } from 'ag-charts-community';
import {
    LineSeriesModule,
    NumberAxisModule,
    TimeAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';


ModuleRegistry.registerModules([LineSeriesModule, NumberAxisModule, TimeAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Monthly average daily temperatures in the UK',
    },
    series: [
        {
            type: 'line',
            xKey: 'date',
            yKey: 'temp',
        },
    ],
    axes: {
        x: {
            type: 'time',
            nice: false,
            position: 'bottom',
            interval: {
                step: { unit: 'day', step: 7, epoch: new Date('2025-01-01') },
            },
            label: {
                autoRotate: true,
            },
        },
        y: {
            type: 'number',
            position: 'left',
            label: {
                format: '#{~f} °C',
            },
        },
    },
    data: [
        { date: new Date('2025-01-01'), temp: 4.2 },
        { date: new Date('2025-01-08'), temp: 4.9 },
        { date: new Date('2025-01-15'), temp: 5.1 },
        { date: new Date('2025-01-22'), temp: 6.9 },
        { date: new Date('2025-01-29'), temp: 7.2 },
        { date: new Date('2025-02-05'), temp: 7.5 },
        { date: new Date('2025-02-12'), temp: 7.9 },
        { date: new Date('2025-02-19'), temp: 8.7 },
        { date: new Date('2025-02-26'), temp: 8.8 },
        { date: new Date('2025-03-05'), temp: 9.1 },
        { date: new Date('2025-03-12'), temp: 9.2 },
        { date: new Date('2025-03-19'), temp: 9.3 },
        { date: new Date('2025-03-26'), temp: 9.5 },
        { date: new Date('2025-04-02'), temp: 9.8 },
        { date: new Date('2025-04-09'), temp: 10.2 },
        { date: new Date('2025-04-16'), temp: 10.7 },
        { date: new Date('2025-04-23'), temp: 10.8 },
        { date: new Date('2025-04-30'), temp: 11.2 },
        { date: new Date('2025-05-07'), temp: 11.3 },
    ],
};

const chart = AgCharts.create(options);

function setOneWeekInterval() {
    (options.axes!.x as AgUnitTimeAxisThemeOptions).interval!.step = {
        unit: 'day',
        step: 7,
        epoch: new Date('2025-01-01'),
    };
    chart.update(options);
}

function setOneMonthInterval() {
    (options.axes!.x as AgUnitTimeAxisThemeOptions).interval!.step = 'month';
    chart.update(options);
}

function setTwoMonthInterval() {
    (options.axes!.x as AgUnitTimeAxisThemeOptions).interval!.step = { unit: 'month', step: 2 };
    chart.update(options);
}
