import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import {
    CategoryAxisModule,
    LineSeriesModule,
    LogAxisModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';


ModuleRegistry.registerModules([CategoryAxisModule, LineSeriesModule, LogAxisModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { os: 'A', share: 10 },
        { os: 'B', share: 100 },
        { os: 'C', share: 1000 },
    ],
    series: [
        {
            type: 'line',
            xKey: 'os',
            yKey: 'share',
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
        },
    },
};

const chart = AgCharts.create(options);

function setNumberAxis() {
    options.axes = {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'number',
            position: 'left',
            min: 1,
            label: {
                format: '.0f',
            },
        },
    };
    chart.update(options);
}

function setLogAxis() {
    options.axes = {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'log',
            position: 'left',
            min: 10,
            label: {
                format: '.0f',
            },
        },
    };
    chart.update(options);
}

function setBaseTwoLogAxis() {
    options.axes = {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'log',
            position: 'left',
            min: 10,
            label: {
                format: '.0f',
            },
            base: 2,
        },
    };
    chart.update(options);
}

function setLogAxisWithFewerTicks() {
    options.axes = {
        x: {
            type: 'category',
            position: 'bottom',
        },
        y: {
            type: 'log',
            position: 'left',
            min: 10,
            interval: {
                minSpacing: 200,
            },
            label: {
                format: '.0f',
            },
        },
    };
    chart.update(options);
}
