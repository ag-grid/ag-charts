import { AgCartesianChartOptions, AgCharts, AllEnterpriseModule, ModuleRegistry } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AllEnterpriseModule]);

const data = [
    { month: 'Jan', units: 25 },
    { month: 'Feb', units: 32 },
    { month: 'Mar', units: 27 },
    { month: 'Apr', units: 42 },
    { month: 'May', units: 38 },
    { month: 'Jun', units: 30 },
];

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    data,
    series: [{ type: 'bar', xKey: 'month', yKey: 'units', yName: 'Units' }],
    axes: {
        x: { type: 'category', listeners: { click: () => {} } },
        y: { type: 'number', listeners: { click: () => {} } },
    },
};

const chart = AgCharts.create(options);

// For e2e testing: the spec calls these directly, since clicking a control would take the keyboard focus away.
(window as any).agE2E = {
    removeLastMonth: () => chart.update({ ...options, data: data.slice(0, -1) }),
    removeData: () => chart.update({ ...options, data: [] }),
    removeXListener: () => chart.update({ ...options, axes: { ...options.axes, x: { type: 'category' } } }),
};
