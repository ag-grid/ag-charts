import { AgChartOptions, AgCharts, LegendModule, ModuleRegistry, PieSeriesModule } from 'ag-charts-community';

ModuleRegistry.registerModules([PieSeriesModule, LegendModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    title: {
        text: 'Colour Formats',
    },
    data: [
        { format: '#4878d0', value: 30 },
        { format: 'rgb(238, 133, 75)', value: 25 },
        { format: 'hsl(145, 63%, 42%)', value: 25 },
        { format: 'oklch(70% 0.15 200)', value: 20 },
        { format: 'mediumpurple', value: 20 },
    ],
    series: [
        {
            type: 'pie',
            angleKey: 'value',
            legendItemKey: 'format',
            // Each slice is filled with the colour named by its legend label.
            fills: [
                '#4878d0', // hex
                'rgb(238, 133, 75)', // rgb
                'hsl(145, 63%, 42%)', // hsl
                'oklch(70% 0.15 200)', // oklch
                'mediumpurple', // named colour
            ],
            strokeWidth: 0,
        },
    ],
    legend: {
        position: 'right',
    },
};

AgCharts.create(options);
