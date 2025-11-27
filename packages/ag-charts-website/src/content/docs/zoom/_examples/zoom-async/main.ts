import {
    AgCartesianChartOptions,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    TimeAxisModule,
} from 'ag-charts-community';
import {
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    DataSourceModule,
    NavigatorModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { FakeServer } from './fakeServer';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    DataSourceModule,
    LegendModule,
    LineSeriesModule,
    NavigatorModule,
    NumberAxisModule,
    TimeAxisModule,
    ZoomModule,
    ContextMenuModule,
]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    dataSource: {
        getData: ({ windowStart, windowEnd }) => {
            // Request the data from the server, this is an asynchronous call which may take up to 500ms. In your
            // application, replace this with a call to your server api.
            return FakeServer.get({ windowStart, windowEnd });
        },
    },
    navigator: {
        enabled: true,
    },
    zoom: {
        enabled: true,
    },
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'price',
            yName: 'Price',
        },
    ],
    axes: {
        y: {
            type: 'number',
            position: 'left',
            min: 400,
            max: 1600,
        },
        x: {
            type: 'time',
            position: 'bottom',
            min: new Date('2019-01-01 00:00:00'),
            max: new Date('2024-12-30 23:59:59'),
            interval: {
                minSpacing: 100,
                maxSpacing: 200,
            },
            label: {
                formatter: ({ value }) =>
                    Intl.DateTimeFormat('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: '2-digit',
                    }).format(new Date(value)),
            },
        },
    },
};

AgCharts.create(options);
