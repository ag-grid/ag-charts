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
        { from: 'Footwear', to: 'North America', size: 2245 },
        { from: 'Footwear', to: 'Europe, Middle East & Africa', size: 1419 },
        { from: 'Footwear', to: 'Asia Pacific & Latin America', size: 879 },
        { from: 'Footwear', to: 'Greater China', size: 1022 },
        { from: 'Apparel', to: 'North America', size: 1405 },
        { from: 'Apparel', to: 'Asia Pacific & Latin America', size: 360 },
        { from: 'Apparel', to: 'Europe, Middle East & Africa', size: 794 },
        { from: 'Apparel', to: 'Greater China', size: 490 },
        { from: 'Equipment', to: 'North America', size: 132 },
        { from: 'Equipment', to: 'Europe, Middle East & Africa', size: 100 },
        { from: 'Equipment', to: 'Asia Pacific & Latin America', size: 59 },
        { from: 'Equipment', to: 'Greater China', size: 32 },
        { from: 'North America', to: 'NIKE Brand', size: 3782 },
        { from: 'Europe, Middle East & Africa', to: 'NIKE Brand', size: 2313 },
        { from: 'Greater China', to: 'NIKE Brand', size: 1544 },
        { from: 'Asia Pacific & Latin America', to: 'NIKE Brand', size: 1298 },
        { from: 'Global Brand Divisions', to: 'NIKE Brand', size: 9 },
        { from: 'NIKE Brand', to: 'Revenues', size: 8946 },
        { from: 'Converse', to: 'Revenues', size: 425 },
        { from: 'Corporate', to: 'Revenues', size: 3 },
        { from: 'Revenues', to: 'Cost of sales', size: 5269 },
        { from: 'Revenues', to: 'Gross profit', size: 4105 },
        { from: 'Gross profit', to: 'Selling and administrative expense', size: 3142 },
        { from: 'Gross profit', to: 'Interest expense', size: 14 },
        { from: 'Gross profit', to: 'Income before taxes', size: 949 },
        { from: 'Other income', to: 'Income before taxes', size: 48 },
        { from: 'Selling and administrative expense', to: 'Demand creation expense', size: 910 },
        { from: 'Selling and administrative expense', to: 'Operating overhead expense', size: 2232 },
        { from: 'Income before taxes', to: 'Tax expense', size: 150 },
        { from: 'Income before taxes', to: 'Net income', size: 847 },
    ],
    series: [
        {
            type: 'sankey',
            fromKey: 'from',
            toKey: 'to',
            sizeKey: 'size',
            sizeName: 'Total (USD millions)',
            node: {
                alignment: 'center',
                sort: 'auto',
            },
        },
    ],
};

const chart = AgCharts.create(options);

function sortData() {
    (options.series![0] as AgSankeySeriesOptions).node!.sort = 'data';
    chart.update(options);
}

function sortAscending() {
    (options.series![0] as AgSankeySeriesOptions).node!.sort = 'ascending';
    chart.update(options);
}

function sortDescending() {
    (options.series![0] as AgSankeySeriesOptions).node!.sort = 'descending';
    chart.update(options);
}

function sortAuto() {
    (options.series![0] as AgSankeySeriesOptions).node!.sort = 'auto';
    chart.update(options);
}
