import {
    AgCharts,
    AgFlowProportionChartOptions,
    AgSankeySeriesOptions,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    LegendModule,
    ModuleRegistry,
    SankeySeriesModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([AnimationModule, CrosshairModule, LegendModule, SankeySeriesModule, ContextMenuModule]);
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
                verticalAlignment: 'center',
            },
        },
    ],
};

const chart = AgCharts.create(options);

function verticalAlignTop() {
    (options.series![0] as AgSankeySeriesOptions).node!.verticalAlignment = 'top';
    chart.update(options);
}

function verticalAlignBottom() {
    (options.series![0] as AgSankeySeriesOptions).node!.verticalAlignment = 'bottom';
    chart.update(options);
}

function verticalAlignCenter() {
    (options.series![0] as AgSankeySeriesOptions).node!.verticalAlignment = 'center';
    chart.update(options);
}
