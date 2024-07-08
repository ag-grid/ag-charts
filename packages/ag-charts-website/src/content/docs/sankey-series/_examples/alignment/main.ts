// Fictitious data used for demonstration purposes
import { AgCharts, AgFlowProportionChartOptions, AgSankeySeriesOptions } from 'ag-charts-enterprise';

const options: AgFlowProportionChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Company Revenue',
    },
    subtitle: {
        text: '2023',
    },
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
            sizeName: 'Total (USD millions)',
            node: {
                alignment: 'left',
            },
        },
    ],
};

const chart = AgCharts.create(options);

function alignLeft() {
    (options.series![0] as AgSankeySeriesOptions).node!.alignment = 'left';
    chart.update(options);
}

function alignRight() {
    (options.series![0] as AgSankeySeriesOptions).node!.alignment = 'right';
    chart.update(options);
}

function alignCenter() {
    (options.series![0] as AgSankeySeriesOptions).node!.alignment = 'center';
    chart.update(options);
}

function alignJustify() {
    (options.series![0] as AgSankeySeriesOptions).node!.alignment = 'justify';
    chart.update(options);
}
