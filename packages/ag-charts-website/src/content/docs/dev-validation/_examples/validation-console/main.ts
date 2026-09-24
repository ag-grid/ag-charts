import {
    AgCartesianChartOptions,
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
};

const chart = AgCharts.create(options);

let warningsForwardedToLog = false;

// Invalid on purpose: opacity must be between 0 and 1, so this raises a validation warning.
function applyInvalidOptions() {
    // Forward warnings written to the browser console into `console.log` too, so they're visible
    // without opening DevTools. Guarded so repeated clicks don't stack duplicate forwarding.
    if (!warningsForwardedToLog) {
        const originalWarn = console.warn.bind(console);
        console.warn = (...args: unknown[]) => {
            originalWarn(...args);
            console.log(...args);
        };
        warningsForwardedToLog = true;
    }

    const isWarningSelected = (document.getElementById('console-on-warning') as HTMLInputElement).checked;
    const consoleOn: ('error' | 'warning' | 'deprecation')[] = isWarningSelected ? ['warning'] : [];
    options.series = [{ type: 'bar', xKey: 'day', yKey: 'sales', fillOpacity: 2 }];
    options.validations = { consoleOn };
    chart.update(options);
}
