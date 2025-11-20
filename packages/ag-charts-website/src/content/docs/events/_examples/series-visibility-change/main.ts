import {
    AgChartLegendClickEvent,
    AgCharts,
    AgPolarChartOptions,
    AgSeriesVisibilityChange,
} from 'ag-charts-community';
import { LegendModule, PieSeriesModule, ModuleRegistry } from 'ag-charts-community';


ModuleRegistry.registerModules([LegendModule, PieSeriesModule]);
let counter = 1;

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
    legend: {
        listeners: {
            legendItemClick: (event: AgChartLegendClickEvent) => {
                counter = (counter + 1) % 2;
                document.getElementById('myCounter')!.textContent = `${counter}`;
                if (counter !== 1) {
                    event.preventDefault();
                }
            },
        },
    },
    listeners: {
        seriesVisibilityChange: ({ seriesId, itemId, legendItemName, visible }: AgSeriesVisibilityChange) => {
            console.log(
                `seriesId: ${seriesId}, itemId: ${itemId}, legendItemName: ${legendItemName}, visible: ${visible}`
            );
        },
    },
};

AgCharts.create(options);
