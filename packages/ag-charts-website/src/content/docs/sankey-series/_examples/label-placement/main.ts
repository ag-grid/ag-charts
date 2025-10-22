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
            label: {
                placement: 'right',
                edgePlacement: 'outside',
            },
        },
    ],
};

const chart = AgCharts.create(options);

function placeLeft() {
    (options.series![0] as AgSankeySeriesOptions).label!.placement = 'left';
    chart.update(options);
}

function placeRight() {
    (options.series![0] as AgSankeySeriesOptions).label!.placement = 'right';
    chart.update(options);
}

function placeCenter() {
    (options.series![0] as AgSankeySeriesOptions).label!.placement = 'center';
    chart.update(options);
}

function placeEdgeInside() {
    (options.series![0] as AgSankeySeriesOptions).label!.edgePlacement = 'inside';
    chart.update(options);
}

function placeEdgeOutside() {
    (options.series![0] as AgSankeySeriesOptions).label!.edgePlacement = 'outside';
    chart.update(options);
}

function placeEdgeDefault() {
    (options.series![0] as AgSankeySeriesOptions).label!.edgePlacement = undefined;
    chart.update(options);
}
