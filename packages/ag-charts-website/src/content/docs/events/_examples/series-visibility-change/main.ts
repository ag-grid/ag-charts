import { AgCharts, AgPolarChartOptions, AgSeriesVisibilityChange } from 'ag-charts-community';
import { LegendModule, ModuleRegistry, PieSeriesModule } from 'ag-charts-community';

ModuleRegistry.registerModules([LegendModule, PieSeriesModule]);

let options: AgPolarChartOptions = {
    container: document.getElementById('myChart'),
    title: { text: 'Business Expense Distribution' },
    data: [
        { expense: 'Salaries', percentage: 40 },
        { expense: 'Office Rent', percentage: 20 },
        { expense: 'Marketing', percentage: 15 },
        { expense: 'Research & Development', percentage: 10 },
        { expense: 'Utilities & Miscellaneous', percentage: 10 },
        { expense: 'Travel', percentage: 5 },
    ],
    series: [{ type: 'pie', angleKey: 'percentage', legendItemKey: 'expense' }],
    listeners: {
        seriesVisibilityChange: (event: AgSeriesVisibilityChange) => {
            console.log('[series visibility change]', event);
        },
    },
};

AgCharts.create(options);
