import {
    AgCartesianChartOptions,
    AgCharts,
    ContextMenuModule,
    LineSeriesModule,
    LogAxisModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

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
            title: {
                text: 'Population',
            },
            label: {
                format: ',.0f',
            },
        },
        x: {
            type: 'number',
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
