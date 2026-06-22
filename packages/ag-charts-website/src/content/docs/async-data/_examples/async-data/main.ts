import {
    AgCartesianChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    DataSourceModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NavigatorModule,
    NumberAxisModule,
    TimeAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

import { Database } from './data';
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
        getData: ({ windowStart, windowEnd, source }) => {
            // Request the data from the server, this is an asynchronous call which may take up to 2500ms. In your
            // application, replace this with a call to your server api.
            // The navigator mini chart requests a coarse, full-range overview; the main chart requests the visible
            // window, and the server returns higher-resolution data as the window narrows.
            return source === 'mini-chart' ? FakeServer.get({}) : FakeServer.get({ windowStart, windowEnd });
        },
    },
    navigator: {
        enabled: true,
        miniChart: {},
    },
    zoom: {
        enabled: true,
    },
    initialState: {
        zoom: {
            ratioX: { start: 0.7, end: 1 },
        },
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
            min: 400,
            max: 1600,
        },
        x: {
            type: 'time',
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

const chart = AgCharts.create(options);

// Refresh the underlying server data, then call updateDelta({}) to re-trigger getData for the
// current window. The chart shows its loading overlay while the new data is fetched.
function reload() {
    Database.refresh();
    chart.updateDelta({});
}
