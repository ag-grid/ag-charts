import {
    AgChartOptions,
    AgCharts,
    CategoryAxisModule,
    LineSeriesModule,
    ModuleRegistry,
    NumberAxisModule,
    RangesModule,
    ZoomModule,
} from 'ag-charts-enterprise';

ModuleRegistry.registerModules([CategoryAxisModule, LineSeriesModule, NumberAxisModule, RangesModule, ZoomModule]);

const options: AgChartOptions = {
    container: document.getElementById('myChart'),
    data: Array.from({ length: 20 }, (_, i) => ({ x: `Cat ${i}`, y: i * 10 })),
    series: [{ type: 'line', xKey: 'x', yKey: 'y' }],
    axes: {
        x: { type: 'category', position: 'bottom' },
        y: { type: 'number', position: 'left' },
    },
    zoom: { enabled: true },
    ranges: {
        enabled: true,
        buttons: [
            { label: 'Half', value: ['Cat 0', 'Cat 9'] },
            { label: 'All', value: undefined },
        ],
    },
};

const chart = AgCharts.create(options);
(window as any).chart = chart;
(window as any).AgCharts = AgCharts;
(window as any).chartOptions = options;
