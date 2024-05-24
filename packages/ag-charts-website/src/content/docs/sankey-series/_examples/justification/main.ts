// Fictitious data used for demonstration purposes
import { AgChartOptions, AgCharts, AgSankeySeriesOptions } from 'ag-charts-enterprise';

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { from: 'Employees', to: 'Sales', size: 2 },
        { from: 'Contractors', to: 'Sales', size: 2 },
        { from: 'Sales', to: 'Revenue', size: 4 },
        { from: 'Licenses', to: 'Revenue', size: 4 },
        { from: 'Revenue', to: 'Cost of Sales', size: 1 },
        { from: 'Revenue', to: 'Profit', size: 7 },
        { from: 'Profit', to: 'Other Expenses', size: 2 },
        { from: 'Profit', to: 'Operational Profit', size: 5 },
        { from: 'Operational Profit', to: 'Shareholders', size: 3 },
        { from: 'Operational Profit', to: 'Employee Bonuses', size: 2 },
    ],
    series: [
        {
            type: 'sankey',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'size',
            node: {
                justify: 'left',
            },
        },
    ],
};

const chart = AgCharts.create(options);

function justifyLeft() {
    (options.series![0] as AgSankeySeriesOptions).node!.justify = 'left';
    AgCharts.update(chart, options);
}

function justifyRight() {
    (options.series![0] as AgSankeySeriesOptions).node!.justify = 'right';
    AgCharts.update(chart, options);
}

function justifyCenter() {
    (options.series![0] as AgSankeySeriesOptions).node!.justify = 'center';
    AgCharts.update(chart, options);
}

function justifyJustify() {
    (options.series![0] as AgSankeySeriesOptions).node!.justify = 'justify';
    AgCharts.update(chart, options);
}
