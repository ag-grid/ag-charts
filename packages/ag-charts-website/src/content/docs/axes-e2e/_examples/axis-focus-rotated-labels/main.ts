import { AgCartesianChartOptions, AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data: months.map((month, i) => ({ month: `${month} 2025`, units: 20 + ((i * 7) % 25) })),
    series: [{ type: 'bar', xKey: 'month', yKey: 'units' }],
    axes: {
        x: {
            type: 'category',
            label: { rotation: 335 },
            listeners: { click: (event) => console.log('x-axis click', event.value) },
        },
        y: {
            type: 'number',
        },
    },
};

AgCharts.create(options);
