import {
    AgCartesianChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    LegendModule,
    ModuleRegistry,
    NumberAxisModule,
    ZoomModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([
    BarSeriesModule,
    CategoryAxisModule,
    ContextMenuModule,
    LegendModule,
    NumberAxisModule,
    ZoomModule,
]);

const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    styleNonce: 'a1b2c3d4',
    data: [
        { month: 'Jan', sales: 162000, profit: 42000 },
        { month: 'Feb', sales: 230000, profit: 58000 },
        { month: 'Mar', sales: 302000, profit: 75000 },
        { month: 'Apr', sales: 450000, profit: 112000 },
        { month: 'May', sales: 800000, profit: 200000 },
        { month: 'Jun', sales: 920000, profit: 230000 },
        { month: 'Jul', sales: 1254000, profit: 313000 },
        { month: 'Aug', sales: 1100000, profit: 275000 },
        { month: 'Sep', sales: 950000, profit: 237000 },
        { month: 'Oct', sales: 680000, profit: 170000 },
        { month: 'Nov', sales: 400000, profit: 100000 },
        { month: 'Dec', sales: 200000, profit: 50000 },
    ],
    series: [
        { type: 'bar', xKey: 'month', yKey: 'sales', yName: 'Sales' },
        { type: 'bar', xKey: 'month', yKey: 'profit', yName: 'Profit' },
    ],
    zoom: {
        enabled: true,
        buttons: {
            visible: 'always',
        },
    },
};

AgCharts.create(options);
