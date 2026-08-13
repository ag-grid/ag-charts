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
            // Invalid on purpose: opacity must be between 0 and 1, so this raises a validation warning.
            fillOpacity: 2,
        },
    ],
    axes: {
        x: { type: 'category' },
        y: { type: 'number' },
    },
    validations: {
        overlayLevel: 'warning',
    },
};

AgCharts.create(options);
