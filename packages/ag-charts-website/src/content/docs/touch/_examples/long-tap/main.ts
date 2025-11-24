import {
    CategoryAxisModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';
import { AgCartesianChartOptions, AgCharts, AnimationModule, CrosshairModule, ZoomModule } from 'ag-charts-enterprise';

ModuleRegistry.registerModules([
    AnimationModule,
    CategoryAxisModule,
    CrosshairModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    ZoomModule,
]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Financial Performance Overview',
    },
    animation: { enabled: false },
    data: [
        { year: 2018, revenue: 120, expenses: 80, profit: 40, investments: 30, taxes: 20, dividends: 10, rAndD: 25 },
        { year: 2019, revenue: 140, expenses: 90, profit: 50, investments: 40, taxes: 25, dividends: 12, rAndD: 30 },
        { year: 2020, revenue: 160, expenses: 100, profit: 60, investments: 50, taxes: 30, dividends: 15, rAndD: 35 },
        { year: 2021, revenue: 180, expenses: 110, profit: 70, investments: 55, taxes: 35, dividends: 18, rAndD: 40 },
        { year: 2022, revenue: 200, expenses: 120, profit: 80, investments: 60, taxes: 40, dividends: 20, rAndD: 45 },
    ],
    series: [
        { type: 'line', xKey: 'year', yKey: 'revenue', yName: 'Revenue' },
        { type: 'line', xKey: 'year', yKey: 'expenses', yName: 'Expenses' },
        { type: 'line', xKey: 'year', yKey: 'profit', yName: 'Profit' },
        { type: 'line', xKey: 'year', yKey: 'investments', yName: 'Investments' },
        { type: 'line', xKey: 'year', yKey: 'taxes', yName: 'Taxes' },
        { type: 'line', xKey: 'year', yKey: 'dividends', yName: 'Dividends' },
        { type: 'line', xKey: 'year', yKey: 'rAndD', yName: 'R&D Spending' },
    ],
};

AgCharts.create(options);
