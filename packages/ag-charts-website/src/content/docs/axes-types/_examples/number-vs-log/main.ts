import { AgCartesianChartOptions, AgCharts, LegendModule } from 'ag-charts-community';
import {
    CategoryAxisModule,
    LineSeriesModule,
    LogAxisModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

ModuleRegistry.registerModules([CategoryAxisModule, LegendModule, LineSeriesModule, LogAxisModule, NumberAxisModule]);
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
};

const chart = AgCharts.create(options);

function setNumberAxis() {
    options.axes = {
        y: {
            type: 'number',
            label: {
                format: '.0f',
            },
        },
    };
    chart.update(options);
}

function setLogAxis() {
    options.axes = {
        y: {
            type: 'log',
            label: {
                format: '.0f',
            },
        },
    };
    chart.update(options);
}

function setBaseTwoLogAxis() {
    options.axes = {
        y: {
            type: 'log',
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
        y: {
            type: 'log',
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
