import { AgCartesianChartOptions, AgCharts } from 'ag-charts-community';
import { CategoryAxisModule, LineSeriesModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

ModuleRegistry.registerModules([CategoryAxisModule, LineSeriesModule, NumberAxisModule]);
const options: AgCartesianChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: "Most Common Girls' First Names In English",
    },
    subtitle: {
        text: 'over the past 100 years',
    },
    data: [
        { name: 'Mary', count: 234000 },
        { name: 'Patricia', count: 211000 },
        { name: 'Jennifer', count: 178000 },
        { name: 'Elizabeth', count: 153000 },
        { name: 'Linda', count: 123000 },
    ],
    series: [
        {
            type: 'line',
            xKey: 'name',
            yKey: 'count',
        },
    ],
    axes: {
        x: {
            type: 'category',
            position: 'bottom',
            gridLine: {
                enabled: true,
            },
        },
        y: {
            type: 'number',
            position: 'left',
            gridLine: {
                enabled: true,
            },
        },
    },
};

const chart = AgCharts.create(options);

function setGridStyle1() {
    var gridStyle = [
        {
            stroke: 'gray',
            lineDash: [10, 5],
        },
        {
            stroke: 'lightgray',
            lineDash: [5, 5],
        },
    ];
    options.axes!.x!.gridLine!.style = gridStyle;
    options.axes!.y!.gridLine!.style = gridStyle;
    chart.update(options);
}

function setGridStyle2() {
    var xGridStyle = [
        {
            stroke: 'red',
            lineDash: [3, 3],
        },
    ];
    var yGridStyle = [
        {
            stroke: 'green',
            lineDash: [8, 3, 3, 3],
        },
    ];
    options.axes!.x!.gridLine!.style = xGridStyle;
    options.axes!.y!.gridLine!.style = yGridStyle;
    chart.update(options);
}

function setDefaultGridStyle() {
    delete options.axes!.x!.gridLine!.style;
    delete options.axes!.y!.gridLine!.style;
    chart.update(options);
}
