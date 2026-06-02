import {
    AgCartesianChartOptions,
    AgCharts,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    TimeAxisModule,
} from 'ag-charts-community';

ModuleRegistry.registerModules([LineSeriesModule, NumberAxisModule, TimeAxisModule]);

// Dates are supplied as strict ISO 8601 strings rather than Date objects. The
// time axis parses them on demand; offsets are honoured as written.
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Hourly Readings' },
    subtitle: { text: 'Timestamps provided as ISO 8601 strings' },
    data: [
        { time: '2024-01-15T09:00:00Z', value: 12.4 },
        { time: '2024-01-15T10:00:00Z', value: 13.1 },
        { time: '2024-01-15T11:00:00Z', value: 14.8 },
        { time: '2024-01-15T12:00:00Z', value: 14.2 },
        { time: '2024-01-15T13:00:00Z', value: 15.6 },
        { time: '2024-01-15T14:00:00Z', value: 16.0 },
    ],
    series: [
        {
            type: 'line',
            xKey: 'time',
            yKey: 'value',
            yName: 'Reading',
        },
    ],
    axes: {
        x: { type: 'time' },
        y: { type: 'number' },
    },
};

AgCharts.create(options);
