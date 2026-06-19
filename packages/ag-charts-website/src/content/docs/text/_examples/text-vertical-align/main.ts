import {
    AgChartOptions,
    AgCharts,
    BarSeriesModule,
    CategoryAxisModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-community';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);

function buildTitle(verticalAlign: 'baseline' | 'top' | 'middle' | 'bottom') {
    return [
        { text: '🚀 ', fontSize: 36, verticalAlign },
        { text: 'Quarterly ', fontSize: 16, verticalAlign },
        { text: 'Spending ', fontSize: 28, verticalAlign },
        { text: 'Growth', fontSize: 20, verticalAlign },
    ];
}

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: buildTitle('baseline'),
        fontWeight: 'bold',
    },
    data: [
        { quarter: 'Q1', sales: 120 },
        { quarter: 'Q2', sales: 180 },
        { quarter: 'Q3', sales: 240 },
        { quarter: 'Q4', sales: 310 },
    ],
    series: [
        {
            type: 'bar',
            xKey: 'quarter',
            yKey: 'sales',
            yName: 'Sales',
        },
    ],
};

const chart = AgCharts.create(options);

function setVerticalAlign(verticalAlign: 'baseline' | 'top' | 'middle' | 'bottom') {
    chart.updateDelta({ title: { text: buildTitle(verticalAlign) } });
}
