import {
    AgChartOptions,
    AgCharts,
    AnimationModule,
    ContextMenuModule,
    CrosshairModule,
    DataSourceModule,
    LegendModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([
    AnimationModule,
    CrosshairModule,
    DataSourceModule,
    LegendModule,
    LineSeriesModule,
    NumberAxisModule,
    ContextMenuModule,
]);

const datasets = [
    [120, 145, 98, 160, 135],
    [200, 175, 220, 190, 210],
    [80, 95, 70, 110, 85],
    [155, 130, 180, 145, 165],
];

let loadIndex = 0;

function getData() {
    const values = datasets[loadIndex % datasets.length];
    loadIndex++;
    return values.map((spending, i) => ({ year: 2020 + i, spending }));
}

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    dataSource: {
        getData: () => new Promise((resolve) => setTimeout(() => resolve(getData()), 2000)),
    },
    series: [
        {
            type: 'line',
            xKey: 'year',
            yKey: 'spending',
        },
    ],
    axes: {
        x: { type: 'number', title: { text: 'Year' } },
        y: { type: 'number', title: { text: 'Spending' } },
    },
};

const chart = AgCharts.create(options);

function setLoading(value: boolean | undefined) {
    chart.updateDelta({ loading: value });
}

function reload() {
    chart.updateDelta({});
}
