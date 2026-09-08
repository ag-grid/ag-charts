import {
    AgCartesianChartOptions,
    AgChartValidationIssueEvent,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Weekly Sales',
    },
    data: [
        { day: 'Mon', sales: 56 },
        { day: 'Tue', sales: 72 },
        { day: 'Wed', sales: 64 },
        { day: 'Thu', sales: 80 },
        { day: 'Fri', sales: 91 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'day',
            yKey: 'sales',
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
    validations: {
        // Disabled so the only console output is the explicit log below, not also the default warning.
        consoleOn: [],
        issueRaised: (event: AgChartValidationIssueEvent) => console.log(event),
    },
};

const chart = AgCharts.create(options);

// Invalid on purpose: opacity must be between 0 and 1, so this raises a validation warning.
function applyInvalidOptions() {
    options.series = [{ type: 'bar', xKey: 'day', yKey: 'sales', fillOpacity: 2 }];
    chart.update(options);
}
