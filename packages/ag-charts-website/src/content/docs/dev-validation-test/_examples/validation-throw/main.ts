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
        // Disabled so the only console output is the explicit log below, not also the default warning.
        consoleOn: [],
        throwOn: ['warning'],
    },
};

let chart: ReturnType<typeof AgCharts.create> | undefined;
try {
    chart = AgCharts.create(options);
} catch (e) {
    console.log(`threw: ${(e as Error).message}`);
}

// Invalid on purpose: opacity must be between 0 and 1, so this raises a validation warning, which
// `throwOn` can turn into a thrown error instead of a console warning.
function applyInvalidOptions() {
    const isWarningSelected = (document.getElementById('throw-on-warning') as HTMLInputElement).checked;
    const throwOn: ('error' | 'warning' | 'deprecation')[] = isWarningSelected ? ['warning'] : [];
    chart?.destroy();
    chart = undefined;
    try {
        chart = AgCharts.create({
            ...options,
            series: [{ type: 'bar', xKey: 'day', yKey: 'sales', fillOpacity: 2 }],
            validations: { consoleOn: [], throwOn },
        });
        console.log('chart created');
    } catch (e) {
        // Thrown before the chart was created, so the container is left empty.
        console.log(`threw: ${(e as Error).message}`);
    }
}
