import { AgChartOptions, AgCharts } from 'ag-charts-community';
import { BarSeriesModule, CategoryAxisModule, ModuleRegistry, NumberAxisModule } from 'ag-charts-community';

ModuleRegistry.registerModules([BarSeriesModule, CategoryAxisModule, NumberAxisModule]);
const customTheme = {
    palette: {
        fills: ['#4F0D4D'],
        strokes: ['#444444'],
    },
    overrides: {
        common: {
            title: {
                fontSize: 22,
                color: '#444444',
            },
        },
        bar: {
            series: {
                label: {
                    enabled: true,
                    color: '#FFFFFF',
                    fontSize: 10,
                },
                strokeWidth: 1,
            },
        },
    },
};

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: [
        { month: 'Jan', avgTemp: 2.3, iceCreamSales: 162000 },
        { month: 'Mar', avgTemp: 6.3, iceCreamSales: 302000 },
        { month: 'May', avgTemp: 16.2, iceCreamSales: 800000 },
        { month: 'Jul', avgTemp: 22.8, iceCreamSales: 1254000 },
        { month: 'Sep', avgTemp: 14.5, iceCreamSales: 950000 },
        { month: 'Nov', avgTemp: 8.9, iceCreamSales: 200000 },
    ],
    background: {
        fill: '#80764440', // or RGB, HEX, HSL, HWB, or named color
    },
    width: 350,
    height: 350,
    theme: customTheme,
    series: [
        {
            type: 'bar',
            xKey: 'month',
            yKey: 'iceCreamSales',
            label: {
                formatter: function (params) {
                    return params.value / 100 / 10.0 + 'k';
                },
            },
        },
    ],
};

const chart = AgCharts.create(options);
