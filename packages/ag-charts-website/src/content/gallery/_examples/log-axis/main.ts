import { AgCartesianChartOptions, AgCharts } from 'ag-charts-enterprise';
import {
    LineSeriesModule,
    LogAxisModule,
    NumberAxisModule,
    ModuleRegistry,
} from 'ag-charts-community';

import { getData } from './data';


ModuleRegistry.registerModules([LineSeriesModule, LogAxisModule, NumberAxisModule]);
const formatter = new Intl.NumberFormat();

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: getData(),
    title: {
        text: 'World Population Over Time',
    },
    subtitle: {
        text: 'log scale',
    },
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'population',
        },
    ],
    axes: {
        y: {
            type: 'log',
            position: 'left',
            title: {
                text: 'Population',
            },
            label: {
                format: ',.0f',
            },
        },
        x: {
            type: 'number',
            position: 'bottom',
            title: {
                text: 'Year',
            },
        },
    },
};

const chart = AgCharts.create(options);

function setNumberAxis() {
    options.subtitle = {
        text: 'linear scale',
    };
    options.axes!.x! = {
        type: 'number',
        position: 'left',
        title: {
            text: 'Population',
        },
        label: {
            format: ',.0f',
        },
    };
    chart.update(options);
}

function setLogAxis() {
    options.subtitle = {
        text: 'log scale',
    };
    options.axes!.x! = {
        type: 'log',
        position: 'left',
        title: {
            text: 'Population',
        },
        label: {
            format: ',.0f',
        },
    };
    chart.update(options);
}
