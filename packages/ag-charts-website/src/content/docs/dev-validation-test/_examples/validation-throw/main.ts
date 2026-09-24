// @ag-skip-fws
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
    validations: {
        // Disabled so the only console output is the explicit logs below, not also the default warning.
        consoleOn: [],
        throwOn: ['warning'],
    },
};

// The throw is asynchronous, so it cannot be caught around `create()`; it surfaces as an uncaught error.
window.addEventListener('error', (event) => {
    console.log(`uncaught: ${event.error?.message ?? event.message}`);
    event.preventDefault();
});

let chart = AgCharts.create(options);

// Invalid on purpose: opacity must be between 0 and 1, so this raises a validation warning, which
// `throwOn` also throws as an error once the chart has applied the fallback.
function applyInvalidOptions() {
    const isWarningSelected = (document.getElementById('throw-on-warning') as HTMLInputElement).checked;
    const throwOn: ('error' | 'warning' | 'deprecation')[] = isWarningSelected ? ['warning'] : [];
    chart.destroy();
    chart = AgCharts.create({
        ...options,
        series: [{ type: 'bar', xKey: 'day', yKey: 'sales', fillOpacity: 2 }],
        validations: { consoleOn: [], throwOn },
    });
    console.log('chart created');
}
